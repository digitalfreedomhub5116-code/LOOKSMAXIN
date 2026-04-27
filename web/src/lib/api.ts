import { createClient } from '@supabase/supabase-js';
import { pushToCloud, pushField } from './sync';

// Public client keys — safe for browser
const url = import.meta.env.VITE_SUPABASE_URL || 'https://jtcqyxrbvxzhzzgrmsom.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_g2L0rujZkZS_mpbC3BhSQA_-Kns1bc0';

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});

const API = import.meta.env.VITE_API_URL || '';

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
  faceImage?: string;
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

// ─── Upload face image to Supabase Storage (raw fetch — bypasses hanging getSession) ───
async function uploadFaceImage(userId: string, base64: string, accessToken: string): Promise<string | null> {
  try {
    // Convert base64 to Blob
    const dataUrl = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    console.log('[Upload] Blob created:', blob.size, 'bytes');

    // Upload directly via Storage REST API (bypasses supabase client's getSession)
    const filename = `${userId}/${Date.now()}.jpg`;
    const uploadUrl = `${url}/storage/v1/object/face-scans/${filename}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': key,
        'Content-Type': blob.type || 'image/jpeg',
        'x-upsert': 'true',
      },
      body: blob,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.warn('[Upload] Storage error:', uploadRes.status, errText);
      return null;
    }

    // Build public URL
    const publicUrl = `${url}/storage/v1/object/public/face-scans/${filename}`;
    console.log('[Upload] ✅ Success:', publicUrl.substring(0, 80));
    return publicUrl;
  } catch (e) {
    console.warn('[Upload] Failed:', e);
    return null;
  }
}

// ─── Save scan (localStorage + Supabase Storage) ───
export function saveScores(scores: FaceScores, faceBase64?: string, userId?: string, accessToken?: string) {
  console.log('[SaveScores] Called. Has base64:', !!faceBase64, 'Score:', scores.overall, 'userId:', userId, 'hasToken:', !!accessToken);

  try {
    // Save scores
    localStorage.setItem(LS_SCORES, JSON.stringify(scores));

    // Save face image immediately (base64 as fallback — will be replaced by URL after upload)
    if (faceBase64) {
      localStorage.setItem(LS_FACE_URL, faceBase64);
    }

    // Append to history — include face image for the reports grid
    const historyEntry: ScanRecord = {
      scores: { ...scores },
      timestamp: new Date().toISOString(),
      faceImage: faceBase64 || undefined,
    };
    delete (historyEntry.scores as any).face_image;
    const history = getScanHistory();
    history.unshift(historyEntry);
    // Keep last 20 reports (with images they take more space)
    localStorage.setItem(LS_HISTORY, JSON.stringify(history.slice(0, 20)));
    console.log('[SaveScores] ✅ localStorage saved');
  } catch (e) {
    console.error('[SaveScores] localStorage save failed:', e);
  }

  // Upload to Supabase Storage + save scan record, THEN sync to cloud immediately
  console.log('[SaveScores] Calling saveToSupabase...');
  saveToSupabase(scores, faceBase64, userId, accessToken).then(() => {
    console.log('[SaveScores] ✅ saveToSupabase completed, pushing to cloud...');
    // After Storage upload, face_url in localStorage is now a URL (not base64)
    // Push ALL data to cloud immediately (not debounced) so other devices get it
    pushToCloud().catch(() => {});
  }).catch((err) => {
    console.warn('[SaveScores] ❌ saveToSupabase failed:', err);
    // Even if Storage upload fails, still push scores & history to cloud
    pushToCloud().catch(() => {});
  });
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
    const historyForCloud = history.map(r => ({ ...r, faceImage: undefined }));
    pushField('scan_history', historyForCloud);
  } catch {}
}

// ─── Get scan count ───
export function getScanCount(): number {
  return getScanHistory().length;
}

// ─── Supabase save (Storage upload + DB insert via raw fetch) ───
async function saveToSupabase(scores: FaceScores, faceBase64?: string, userId?: string, accessToken?: string) {
  try {
    if (!userId || !accessToken) {
      console.warn('[Save] No userId/token — skipping Supabase save');
      return;
    }

    console.log('[Save] Saving scan for user:', userId);

    // Upload face image to Storage bucket and get public URL
    let imageUrl: string | null = null;
    if (faceBase64) {
      console.log('[Save] Uploading face image...', faceBase64.length, 'chars');
      imageUrl = await uploadFaceImage(userId, faceBase64, accessToken);

      if (imageUrl) {
        console.log('[Save] ✅ Face uploaded:', imageUrl.substring(0, 80));
        localStorage.setItem(LS_FACE_URL, imageUrl);

        try {
          const raw = localStorage.getItem(LS_SCORES);
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.face_image = imageUrl;
            localStorage.setItem(LS_SCORES, JSON.stringify(parsed));
          }
        } catch {}
      } else {
        console.warn('[Save] ❌ Face upload returned null');
      }
    }

    // Insert scan record via raw REST API (bypasses supabase client getSession hang)
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
    console.warn('[Save] Supabase save failed:', e);
  }
}
