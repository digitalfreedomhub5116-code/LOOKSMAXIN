/**
 * Leaderboard — Real-time streak leaderboard via Supabase REST API.
 */
import { supabase } from './api';

const SUPABASE_URL = 'https://jtcqyxrbvxzhzzgrmsom.supabase.co';
const SUPABASE_KEY = 'sb_publishable_g2L0rujZkZS_mpbC3BhSQA_-Kns1bc0';
const TABLE = 'leaderboard';
const CACHE_TTL_MS = 60_000;
const LS_LAST_PUSHED_STREAK = 'lynx_lb_last_streak';

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  streak: number;
  updated_at: string;
}

let cachedEntries: LeaderboardEntry[] = [];
let cacheTimestamp = 0;

/**
 * Push the current user's streak to the leaderboard.
 */
export async function pushStreakToLeaderboard(
  userId: string,
  streak: number,
  displayName: string,
  avatarUrl?: string | null,
): Promise<void> {
  const lastPushed = localStorage.getItem(LS_LAST_PUSHED_STREAK);
  if (lastPushed === String(streak)) return;

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
        updated_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      console.warn('[LB] Push fail:', res.status, await res.text());
      return;
    }

    localStorage.setItem(LS_LAST_PUSHED_STREAK, String(streak));
    cacheTimestamp = 0;
    console.log('[LB] ✅ Pushed streak:', streak);
  } catch (err) {
    console.warn('[LB] Push error:', err);
  }
}

/**
 * Fetch the top 50 players by streak.
 * Uses anon key only (no auth needed for SELECT — public RLS policy).
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
    const url = `${SUPABASE_URL}/rest/v1/${TABLE}?select=user_id,display_name,avatar_url,streak,updated_at&order=streak.desc&limit=50`;
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
