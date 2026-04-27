// ═══════════════════════════════════
//  Cross-device Sync via Supabase
//  localStorage = instant cache
//  Supabase = source of truth
// ═══════════════════════════════════

import { supabase } from './api';

const LS_KEYS = {
  scores: 'lynx_latest_scores',
  history: 'lynx_scan_history',
  face: 'lynx_face_url',
  progress: 'lynx_plan_progress',
  chat: 'lynx_chat_history',
  remedies: 'lynx_saved_remedies',
};

type SyncFields = {
  latest_scores: any;
  face_url: string | null;
  scan_history: any[];
  plan_progress: any;
  chat_history: any[];
  saved_remedies: string[];
};

// ─── Get current user ID (UUID) ───
async function getUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch { return null; }
}

// ─── Pull all cloud data → merge into localStorage ───
export async function pullFromCloud(): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  try {
    const { data, error } = await supabase
      .from('lynx_user_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // PGRST116 = no rows found — that's OK, user just hasn't synced yet
      if (error?.code === 'PGRST116') return true;
      console.warn('Cloud pull error:', error?.message);
      return false;
    }

    // Merge: cloud wins for each field that has data
    if (data.latest_scores) {
      localStorage.setItem(LS_KEYS.scores, JSON.stringify(data.latest_scores));
    }
    if (data.face_url) {
      localStorage.setItem(LS_KEYS.face, data.face_url);
    }
    if (data.scan_history && data.scan_history.length > 0) {
      // Merge: take cloud history, deduplicate by timestamp
      const local = safeParseArr(localStorage.getItem(LS_KEYS.history));
      const cloud = data.scan_history;
      const merged = mergeByTimestamp(cloud, local);
      localStorage.setItem(LS_KEYS.history, JSON.stringify(merged.slice(0, 20)));
    }
    if (data.plan_progress && Object.keys(data.plan_progress).length > 0) {
      localStorage.setItem(LS_KEYS.progress, JSON.stringify(data.plan_progress));
    }
    if (data.chat_history && data.chat_history.length > 0) {
      localStorage.setItem(LS_KEYS.chat, JSON.stringify(data.chat_history));
    }
    if (data.saved_remedies && data.saved_remedies.length > 0) {
      localStorage.setItem(LS_KEYS.remedies, JSON.stringify(data.saved_remedies));
    }

    console.log('✅ Cloud data pulled successfully');
    return true;
  } catch (e) {
    console.warn('Cloud pull failed:', e);
    return false;
  }
}

// ─── Push all localStorage → cloud (upsert) ───
export async function pushToCloud(): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  try {
    const payload: any = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    // Read all localStorage
    const scores = safeParseObj(localStorage.getItem(LS_KEYS.scores));
    const face = localStorage.getItem(LS_KEYS.face);
    const history = safeParseArr(localStorage.getItem(LS_KEYS.history));
    const progress = safeParseObj(localStorage.getItem(LS_KEYS.progress));
    const chat = safeParseArr(localStorage.getItem(LS_KEYS.chat));
    const remedies = safeParseArr(localStorage.getItem(LS_KEYS.remedies));

    if (scores) payload.latest_scores = scores;
    if (face && !face.startsWith('data:') && face.length < 500) {
      // Only store URL, not base64
      payload.face_url = face;
    }

    // Strip face images from history to keep payload small
    if (history.length > 0) {
      payload.scan_history = history.map((r: any) => ({
        ...r,
        faceImage: undefined, // Don't store base64 in DB
      }));
    }

    if (progress && Object.keys(progress).length > 0) payload.plan_progress = progress;
    if (chat.length > 0) payload.chat_history = chat.slice(-50);
    if (remedies.length > 0) payload.saved_remedies = remedies;

    const { error } = await supabase
      .from('lynx_user_data')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.warn('Cloud push failed:', error.message);
      return false;
    }
    console.log('✅ Data pushed to cloud');
    return true;
  } catch (e) {
    console.warn('Cloud push failed:', e);
    return false;
  }
}

// ─── Push a single field ───
export async function pushField(field: keyof SyncFields, value: any): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  try {
    const { error } = await supabase
      .from('lynx_user_data')
      .upsert({
        user_id: userId,
        [field]: value,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn(`Sync field "${field}" failed:`, error.message);
    }
  } catch {}
}

// ─── Helpers ───
function safeParseArr(raw: string | null): any[] {
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function safeParseObj(raw: string | null): any | null {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function mergeByTimestamp(primary: any[], secondary: any[]): any[] {
  const seen = new Set<string>();
  const result: any[] = [];
  for (const item of [...primary, ...secondary]) {
    const key = item.timestamp || JSON.stringify(item.scores?.overall);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
