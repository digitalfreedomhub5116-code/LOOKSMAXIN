/**
 * Leaderboard — Real-time streak leaderboard via Supabase REST API.
 * Now includes equipped_border so all users can see each other's borders.
 */
import { supabase } from './api';

const SUPABASE_URL = 'https://jtcqyxrbvxzhzzgrmsom.supabase.co';
const SUPABASE_KEY = 'sb_publishable_g2L0rujZkZS_mpbC3BhSQA_-Kns1bc0';
const TABLE = 'leaderboard';
const CACHE_TTL_MS = 60_000;
const LS_LAST_PUSHED = 'lynx_lb_last_push';

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  streak: number;
  equipped_border: string | null;
  updated_at: string;
}

let cachedEntries: LeaderboardEntry[] = [];
let cacheTimestamp = 0;

/**
 * Push the current user's streak + equipped border to the leaderboard.
 * Only writes when streak or border has changed since last push.
 */
export async function pushStreakToLeaderboard(
  userId: string,
  streak: number,
  displayName: string,
  avatarUrl?: string | null,
  equippedBorder?: string | null,
): Promise<void> {
  // Build a fingerprint to skip redundant pushes
  const fingerprint = `${streak}|${equippedBorder || ''}`;
  const lastPushed = localStorage.getItem(LS_LAST_PUSHED);
  if (lastPushed === fingerprint) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { console.warn('[LB] No token for push'); return; }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: userId,
        display_name: displayName || 'Player',
        avatar_url: avatarUrl || null,
        streak,
        equipped_border: equippedBorder || null,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      console.warn('[LB] Push fail:', res.status, await res.text());
      return;
    }

    localStorage.setItem(LS_LAST_PUSHED, fingerprint);
    cacheTimestamp = 0;
    console.log('[LB] ✅ Pushed streak:', streak, 'border:', equippedBorder || 'none');
  } catch (err) {
    console.warn('[LB] Push error:', err);
  }
}

/**
 * Fetch the top 50 players by streak.
 * Includes equipped_border for rendering other users' borders.
 */
export async function fetchLeaderboard(forceRefresh = false): Promise<LeaderboardEntry[]> {
  console.log('[LB] fetchLeaderboard called, force:', forceRefresh);

  const now = Date.now();
  if (!forceRefresh && cachedEntries.length > 0 && (now - cacheTimestamp) < CACHE_TTL_MS) {
    console.log('[LB] Returning cached', cachedEntries.length, 'entries');
    return cachedEntries;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    console.warn('[LB] ⏱️ Aborting fetch after 8s');
    controller.abort();
  }, 8000);

  try {
    const url = `${SUPABASE_URL}/rest/v1/${TABLE}?select=user_id,display_name,avatar_url,streak,equipped_border,updated_at&order=streak.desc&limit=50`;
    console.log('[LB] Fetching:', url);

    const res = await fetch(url, {
      headers: { 'apikey': SUPABASE_KEY },
      signal: controller.signal,
    });
    clearTimeout(timer);

    console.log('[LB] Response status:', res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[LB] ❌ Fetch failed:', res.status, errText);
      return cachedEntries;
    }

    const data: LeaderboardEntry[] = await res.json();
    cachedEntries = data;
    cacheTimestamp = now;
    console.log('[LB] ✅ Fetched', data.length, 'entries');
    return cachedEntries;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn('[LB] ❌ Error:', err.name, err.message);
    return cachedEntries;
  }
}

export function getUserRank(userId: string): number {
  const idx = cachedEntries.findIndex(e => e.user_id === userId);
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * Self-contained border sync — call from Store when border changes.
 * Gets auth session, streak, and pushes everything in one call.
 */
export async function syncBorderToLeaderboard(borderId: string | null): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { console.warn('[LB] No session for border sync'); return; }

    const u = session.user;
    const token = session.access_token;

    // Direct PATCH to update ONLY the border column (fastest, most reliable)
    const patchUrl = `${SUPABASE_URL}/rest/v1/${TABLE}?user_id=eq.${u.id}`;
    const res = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        equipped_border: borderId || null,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[LB] Border PATCH fail:', res.status, errText);
      return;
    }

    // Update cache fingerprint
    localStorage.removeItem(LS_LAST_PUSHED);
    cacheTimestamp = 0;
    console.log('[LB] ✅ Border synced:', borderId || 'none');
  } catch (err) {
    console.warn('[LB] Border sync error:', err);
  }
}
