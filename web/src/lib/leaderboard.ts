/**
 * Leaderboard — Real-time streak leaderboard via Supabase.
 *
 * Table: `leaderboard` (created via SQL below)
 * ┌──────────────┬──────────────┬────────────┬────────┬────────────┐
 * │ user_id (PK) │ display_name │ avatar_url │ streak │ updated_at │
 * └──────────────┴──────────────┴────────────┴────────┴────────────┘
 *
 * Minimum-egress design:
 * 1. Upsert only when streak changes (not every page load)
 * 2. Fetch top 50 only when Ranks tab is opened
 * 3. Cache results for 60s to avoid re-fetches
 * 4. Select only needed columns (no *)
 */
import { supabase } from './api';

const TABLE = 'leaderboard';
const CACHE_TTL_MS = 60_000; // 60 seconds
const LS_LAST_PUSHED_STREAK = 'lynx_lb_last_streak';

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  streak: number;
  updated_at: string;
}

// ─── Cache ───
let cachedEntries: LeaderboardEntry[] = [];
let cacheTimestamp = 0;

/**
 * Push the current user's streak to the leaderboard.
 * Only actually writes if the streak value has changed since last push.
 */
export async function pushStreakToLeaderboard(
  userId: string,
  streak: number,
  displayName: string,
  avatarUrl?: string | null,
): Promise<void> {
  // Skip if streak hasn't changed since last push
  const lastPushed = localStorage.getItem(LS_LAST_PUSHED_STREAK);
  if (lastPushed === String(streak)) return;

  try {
    const { error } = await supabase.from(TABLE).upsert({
      user_id: userId,
      display_name: displayName || 'Player',
      avatar_url: avatarUrl || null,
      streak,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) {
      console.warn('[Leaderboard] Push failed:', error.message);
      return;
    }

    localStorage.setItem(LS_LAST_PUSHED_STREAK, String(streak));
    // Invalidate cache so next fetch gets fresh data
    cacheTimestamp = 0;
    console.log('[Leaderboard] ✅ Pushed streak:', streak);
  } catch (err) {
    console.warn('[Leaderboard] Push error:', err);
  }
}

/**
 * Fetch the top 50 players by streak.
 * Results are cached for 60s to minimize egress.
 * Includes an 8s timeout to prevent infinite loading.
 */
export async function fetchLeaderboard(forceRefresh = false): Promise<LeaderboardEntry[]> {
  const now = Date.now();
  if (!forceRefresh && cachedEntries.length > 0 && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedEntries;
  }

  try {
    // Race the query against a timeout
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));

    const query = supabase
      .from(TABLE)
      .select('user_id, display_name, avatar_url, streak, updated_at')
      .gte('streak', 0)
      .order('streak', { ascending: false })
      .limit(50);

    const result = await Promise.race([query, timeout]);

    if (!result) {
      console.warn('[Leaderboard] Fetch timed out (8s)');
      return cachedEntries;
    }

    const { data, error } = result as { data: LeaderboardEntry[] | null; error: any };

    if (error) {
      console.warn('[Leaderboard] Fetch failed:', error.message, error.details, error.hint);
      return cachedEntries;
    }

    cachedEntries = (data || []) as LeaderboardEntry[];
    cacheTimestamp = now;
    console.log('[Leaderboard] ✅ Fetched', cachedEntries.length, 'entries');
    return cachedEntries;
  } catch (err) {
    console.warn('[Leaderboard] Fetch error:', err);
    return cachedEntries;
  }
}

/**
 * Get the current user's rank in the leaderboard.
 * Returns 0 if not found.
 */
export function getUserRank(userId: string): number {
  const idx = cachedEntries.findIndex(e => e.user_id === userId);
  return idx >= 0 ? idx + 1 : 0;
}
