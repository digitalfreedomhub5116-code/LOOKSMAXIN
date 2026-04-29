import { createClient } from '@supabase/supabase-js';
import { pushToCloud, pushField } from './sync';
import { compressImage, base64ToBlob } from './imageUtils';
import { Capacitor } from '@capacitor/core';

// Public client keys — safe for browser
const url = import.meta.env.VITE_SUPABASE_URL || 'https://mxcvwkdkjsailyoestlv.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Xwc0XCQFr1AIpTcgv9X0tw_TphzEYaf';

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});

// On mobile (Capacitor), API must point to the deployed server, not localhost
const RAILWAY_URL = 'https://www.lynxai.in';
const API = Capacitor.isNativePlatform()
  ? RAILWAY_URL
  : (import.meta.env.VITE_API_URL || '');

// ─── Local Storage Keys ───
const LS_SCORES = 'lynx_latest_scores';
const LS_HISTORY = 'lynx_scan_history';
const LS_FACE_URL = 'lynx_face_url';

export interface TraitDetail {
  score: number;
  rating: string;
  holding_back: string;
  fix_it: string;
}

export interface FaceScores {
  jawline: number;
  skin_quality: number;
  eyes: number;
  lips: number;
  facial_symmetry: number;
  hair_quality: number;
  overall: number;
  potential: number;
  tips: string[];
  face_image?: string;
  // Rich report fields
  overall_rating?: string;
  description?: string;
  traits?: Record<string, TraitDetail>;
  recommendations?: string[];
}

export interface ScanRecord {
  scores: FaceScores;
  timestamp: string;
  faceImage?: string;  // Now stores Supabase Storage URL (not base64)
}

// ─── Gemini AI analysis ───
export async function analyzeFace(frontBase64: string, sideBase64: string, mime = 'image/jpeg'): Promise<FaceScores> {
  const res = await fetch(`${API}/api/analyze-face`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: frontBase64,
      sideImage: sideBase64,
      mimeType: mime,
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(e.error || `Server error ${res.status}`);
  }
  return res.json();
}

// ═══════════════════════════════════════
//  CLOUD-FIRST Image Upload
// ═══════════════════════════════════════
// Compresses image → uploads to Supabase Storage → returns public URL
// Entire process takes 1-2 seconds (50KB upload)
async function uploadFaceImage(userId: string, rawBase64: string, accessToken: string): Promise<string | null> {
  try {
    // Step 1: Compress (12MP → 800px max, ~30-50KB)
    console.log('[Upload] Compressing image...');
    const compressed = await compressImage(rawBase64);
    const blob = base64ToBlob(compressed);
    console.log('[Upload] Compressed to', Math.round(blob.size / 1024), 'KB');

    // Step 2: Upload via raw REST API (bypasses supabase client's getSession hang)
    const filename = `${userId}/${Date.now()}.jpg`;
    const uploadUrl = `${url}/storage/v1/object/face-scans/${filename}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': key,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true',
      },
      body: blob,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.warn('[Upload] Storage error:', uploadRes.status, errText);
      return null;
    }

    // Step 3: Build public URL
    const publicUrl = `${url}/storage/v1/object/public/face-scans/${filename}`;
    console.log('[Upload] ✅ Done in <2s:', publicUrl.substring(0, 80));
    return publicUrl;
  } catch (e) {
    console.warn('[Upload] Failed:', e);
    return null;
  }
}

// ═══════════════════════════════════════
//  CLOUD-FIRST Save Scan
// ═══════════════════════════════════════
// This is the main function called after a scan completes.
// It uploads the image FIRST (awaited), then saves everything.
export async function saveScores(scores: FaceScores, faceBase64?: string, userId?: string, accessToken?: string) {
  const timestamp = new Date().toISOString();
  console.log('[SaveScores] Called. Has base64:', !!faceBase64, 'Score:', scores.overall, 'userId:', userId, 'hasToken:', !!accessToken);

  // ── Step 1: Upload image to cloud FIRST (awaited — not fire-and-forget) ──
  let imageUrl: string | null = null;
  if (faceBase64 && userId && accessToken) {
    try {
      imageUrl = await uploadFaceImage(userId, faceBase64, accessToken);
      if (imageUrl) {
        console.log('[SaveScores] ✅ Image uploaded:', imageUrl.substring(0, 80));
      }
    } catch (e) {
      console.warn('[SaveScores] Image upload failed:', e);
    }
  }

  // ── Step 2: Save to localStorage (with URL if upload succeeded, base64 as fallback) ──
  try {
    // The face URL to use everywhere — prefer cloud URL, fallback to base64
    const faceValue = imageUrl || (faceBase64 ? `data:image/jpeg;base64,${faceBase64}` : null);

    // Save scores
    const scoresToSave = { ...scores };
    if (faceValue) scoresToSave.face_image = faceValue;
    localStorage.setItem(LS_SCORES, JSON.stringify(scoresToSave));

    // Save face URL for dashboard
    if (faceValue) {
      localStorage.setItem(LS_FACE_URL, faceValue);
    }

    // Append to history — EACH REPORT gets its own image URL
    const historyEntry: ScanRecord = {
      scores: { ...scores },
      timestamp,
      faceImage: faceValue || undefined,  // Store the URL (or base64 fallback) per report
    };
    delete (historyEntry.scores as any).face_image;  // Don't duplicate in scores

    const history = getScanHistory();
    history.unshift(historyEntry);
    localStorage.setItem(LS_HISTORY, JSON.stringify(history.slice(0, 20)));
    console.log('[SaveScores] ✅ localStorage saved');
  } catch (e) {
    console.error('[SaveScores] localStorage save failed:', e);
  }

  // ── Step 3: Push ALL data to cloud immediately ──
  try {
    console.log('[SaveScores] Pushing to cloud...');
    await pushToCloud();
    console.log('[SaveScores] ✅ Cloud sync complete');
  } catch (e) {
    console.warn('[SaveScores] Cloud push failed:', e);
  }

  // ── Step 4: Also insert into face_scans table for analytics ──
  if (userId && accessToken) {
    try {
      const insertRes = await fetch(`${url}/rest/v1/face_scans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': key,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          user_id: userId,
          overall_score: scores.overall,
          analysis: {
            jawline: scores.jawline, skin_quality: scores.skin_quality,
            eyes: scores.eyes, lips: scores.lips,
            facial_symmetry: scores.facial_symmetry, hair_quality: scores.hair_quality,
            potential: scores.potential, tips: scores.tips,
          },
          image_url: imageUrl,
        }),
      });

      if (!insertRes.ok) {
        console.warn('[Save] face_scans insert error:', insertRes.status, await insertRes.text());
      } else {
        console.log('[Save] ✅ Scan record saved');
      }
    } catch (e) {
      console.warn('[Save] face_scans insert failed:', e);
    }
  }
}

// ─── Load latest face image URL ───
export function loadFaceImage(): string | null {
  try {
    // Try from saved URL
    const savedUrl = localStorage.getItem(LS_FACE_URL);
    if (savedUrl) return savedUrl;
    // Fallback: check scores object
    const raw = localStorage.getItem(LS_SCORES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.face_image) return parsed.face_image;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Load latest scores (localStorage) ───
export function loadLatestScores(): FaceScores | null {
  try {
    const raw = localStorage.getItem(LS_SCORES);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Get scan history ───
export function getScanHistory(): ScanRecord[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ─── Delete a specific scan report ───
export function deleteReport(timestamp: string) {
  try {
    const history = getScanHistory().filter(r => r.timestamp !== timestamp);
    localStorage.setItem(LS_HISTORY, JSON.stringify(history));
    // Sync deletion to cloud
    pushField('scan_history', history);
  } catch {}
}

// ─── Get scan count ───
export function getScanCount(): number {
  return getScanHistory().length;
}
