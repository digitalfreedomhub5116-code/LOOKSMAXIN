import { createClient } from '@supabase/supabase-js';

// Public client keys — safe for browser
const url = import.meta.env.VITE_SUPABASE_URL || 'https://xdhajxmvmrtajoffzmkm.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkaGFqeG12bXJ0YWpvZmZ6bWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMzI3MzYsImV4cCI6MjA4ODcwODczNn0.3CX2jVMFEj7Oqk13mMCLbadTZa7uM6m5pz2uD5Ndta0';

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

const API = import.meta.env.VITE_API_URL || '';

// ─── Local Storage Keys ───
const LS_SCORES = 'lynx_latest_scores';
const LS_HISTORY = 'lynx_scan_history';

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
}

export interface ScanRecord {
  scores: FaceScores;
  timestamp: string;
}

// ─── Gemini AI analysis ───
export async function analyzeFace(base64: string, mime = 'image/jpeg'): Promise<FaceScores> {
  const res = await fetch(`${API}/api/analyze-face`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, mimeType: mime }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(e.error || `Server error ${res.status}`);
  }
  return res.json();
}

// ─── Save scan (localStorage + Supabase) ───
export function saveScores(scores: FaceScores) {
  try {
    // Save latest
    localStorage.setItem(LS_SCORES, JSON.stringify(scores));

    // Append to history
    const history = getScanHistory();
    history.unshift({ scores, timestamp: new Date().toISOString() });
    // Keep last 50 scans
    localStorage.setItem(LS_HISTORY, JSON.stringify(history.slice(0, 50)));
  } catch (e) {
    console.error('localStorage save failed:', e);
  }

  // Also save to Supabase (fire-and-forget)
  saveToSupabase(scores).catch(() => {});
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

// ─── Get scan count ───
export function getScanCount(): number {
  return getScanHistory().length;
}

// ─── Supabase save (best-effort) ───
async function saveToSupabase(scores: FaceScores) {
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

    await supabase.from('face_scans').insert({
      user_id: userId,
      overall_score: scores.overall,
      analysis: {
        jawline: scores.jawline, skin_quality: scores.skin_quality,
        eyes: scores.eyes, lips: scores.lips,
        facial_symmetry: scores.facial_symmetry, hair_quality: scores.hair_quality,
        potential: scores.potential, tips: scores.tips,
      },
    });
  } catch (e) {
    console.warn('Supabase save failed (non-critical):', e);
  }
}
