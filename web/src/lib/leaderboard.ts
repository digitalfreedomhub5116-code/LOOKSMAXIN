/**
 * Leaderboard — Real-time streak leaderboard via Supabase REST API.
 *
 * Uses raw fetch() instead of Supabase JS client for reliability.
 * The JS client's query builder sometimes hangs on new tables —
 * raw REST calls give us proper HTTP errors and timeouts.
 */
import { supabase } from './api';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jtcqyxrbvxzhzzgrmsom.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_g2L0rujZkZS_mpbC3BhSQA_-Kns1bc0';
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

/** Get the current session's access token for authenticated requests */
async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Push the current user's streak to the leaderboard.
 * Uses Supabase REST API directly for reliability.
 */
export async function pushStreakToLeaderboard(
  userId: string,
  streak: number,
  displayName: string,
  avatarUrl?: string | null,
): Promise<void> {
  const lastPushed = localStorage.getItem(LS_LAST_PUSHED_STREAK);
  if (lastPushed === String(streak)) return;

  const token = await getAccessToken();
  if (!token) {
    console.warn('[Leaderboard] No auth token — skipping push');
    return;
  }

  try {
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
      const errText = await res.text();
      console.warn('[Leaderboard] Push failed:', res.status, errText);
      return;
    }

    localStorage.setItem(LS_LAST_PUSHED_STREAK, String(streak));
    cacheTimestamp = 0;
    console.log('[Leaderboard] ✅ Pushed streak:', streak);
  } catch (err) {
    console.warn('[Leaderboard] Push error:', err);
  }
}

/**
 * Fetch the top 50 players by streak.
 * Uses raw fetch() with AbortController for reliable timeout.
 */
export async function fetchLeaderboard(forceRefresh = false): Promise<LeaderboardEntry[]> {
  const now = Date.now();
  if (!forceRefresh && cachedEntries.length > 0 && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedEntries;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${SUPABASE_URL}/rest/v1/${TABLE}?select=user_id,display_name,avatar_url,streak,updated_at&order=streak.desc&limit=50`;
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Leaderboard] Fetch failed:', res.status, errText);
      return cachedEntries;
    }

    const data: LeaderboardEntry[] = await res.json();
    cachedEntries = data;
    cacheTimestamp = now;
    console.log('[Leaderboard] ✅ Fetched', cachedEntries.length, 'entries');
    return cachedEntries;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      console.warn('[Leaderboard] Fetch timed out (8s)');
    } else {
      console.warn('[Leaderboard] Fetch error:', err);
    }
    return cachedEntries;
  }
}

/** Get the current user's rank from cache. Returns 0 if not found. */
export function getUserRank(userId: string): number {
  const idx = cachedEntries.findIndex(e => e.user_id === userId);
  return idx >= 0 ? idx + 1 : 0;
}
