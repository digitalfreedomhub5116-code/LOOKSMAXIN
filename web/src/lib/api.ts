import { createClient } from '@supabase/supabase-js';

// Public client keys — safe for browser (anon key only, not service key)
const url = import.meta.env.VITE_SUPABASE_URL || 'https://jtcqyxrbvxzhzzgrmsom.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_g2L0rujZkZS_mpbC3BhSQA_-Kns1bc0';

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

// API URL: empty in production (same origin), override in .env for local dev
const API = import.meta.env.VITE_API_URL || '';

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

export async function saveScan(userId: string, scores: FaceScores) {
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
}

export async function getLatestScan(userId: string): Promise<FaceScores | null> {
  const { data } = await supabase
    .from('face_scans')
    .select('overall_score, analysis')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (!data) return null;
  const a = data.analysis as any;
  return {
    jawline: a.jawline, skin_quality: a.skin_quality,
    eyes: a.eyes, lips: a.lips,
    facial_symmetry: a.facial_symmetry, hair_quality: a.hair_quality,
    overall: data.overall_score, potential: a.potential, tips: a.tips || [],
  };
}

export async function getScanCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('face_scans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count || 0;
}
