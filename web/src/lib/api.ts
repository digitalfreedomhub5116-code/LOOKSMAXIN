import { createClient } from '@supabase/supabase-js';

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

// ─── Upload face image to Supabase Storage ───
async function uploadFaceImage(userId: string, base64: string): Promise<string | null> {
  try {
    // Convert base64 to Blob
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'image/jpeg' });

    // Create unique filename: userId/timestamp.jpg
    const filename = `${userId}/${Date.now()}.jpg`;

    // Upload to face-scans bucket
    const { error } = await supabase.storage
      .from('face-scans')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.warn('Storage upload error:', error.message);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('face-scans')
      .getPublicUrl(filename);

    return urlData.publicUrl || null;
  } catch (e) {
    console.warn('Face image upload failed:', e);
    return null;
  }
}

// ─── Save scan (localStorage + Supabase Storage) ───
export function saveScores(scores: FaceScores, faceBase64?: string) {
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
  } catch (e) {
    console.error('localStorage save failed:', e);
  }

  // Upload to Supabase Storage + save scan record (fire-and-forget)
  saveToSupabase(scores, faceBase64).catch(() => {});
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
  } catch {}
}

// ─── Get scan count ───
export function getScanCount(): number {
  return getScanHistory().length;
}

// ─── Supabase save (Storage upload + DB insert) ───
async function saveToSupabase(scores: FaceScores, faceBase64?: string) {
  try {
    let userId: string | null = null;

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      const { data } = await supabase.auth.signInAnonymously();
      userId = data.user?.id || null;
    }

    if (!userId) return;

    // Upload face image to Storage bucket and get public URL
    let imageUrl: string | null = null;
    if (faceBase64) {
      imageUrl = await uploadFaceImage(userId, faceBase64);

      // Save URL to localStorage for instant dashboard load
      if (imageUrl) {
        localStorage.setItem(LS_FACE_URL, imageUrl);

        // Also update saved scores with the URL
        try {
          const raw = localStorage.getItem(LS_SCORES);
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.face_image = imageUrl;
            localStorage.setItem(LS_SCORES, JSON.stringify(parsed));
          }
        } catch {}
      }
    }

    // Insert scan record with image URL
    await supabase.from('face_scans').insert({
      user_id: userId,
      overall_score: scores.overall,
      analysis: {
        jawline: scores.jawline, skin_quality: scores.skin_quality,
        eyes: scores.eyes, lips: scores.lips,
        facial_symmetry: scores.facial_symmetry, hair_quality: scores.hair_quality,
        potential: scores.potential, tips: scores.tips,
      },
      image_url: imageUrl,
    });
  } catch (e) {
    console.warn('Supabase save failed (non-critical):', e);
  }
}
