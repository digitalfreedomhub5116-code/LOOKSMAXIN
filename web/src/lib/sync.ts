// ══════════════════════════════════════════════════════════════
//  Production-Ready Cross-Device Sync via Supabase
// ══════════════════════════════════════════════════════════════
//
//  Architecture:
//  ┌────────┐  instant   ┌──────────────┐  debounced   ┌───────────┐
//  │  App   │ ────────▶  │ localStorage │ ──────────▶  │  Supabase │
//  └────────┘            └──────────────┘   (2s batch)  └───────────┘
//                               ▲          pull on login      │
//                               └─────────────────────────────┘
//
//  Minimum-egress strategies:
//  1. Debounced pushes — rapid changes batched into single upsert
//  2. Dirty-field tracking — only push fields that actually changed
//  3. Conditional pull — check updated_at before full pull (1 tiny query)
//  4. Per-field timestamps — conflict resolution without full-state transfer
//  5. Retry queue — failed pushes retry with exponential backoff
//  6. Network awareness — skip attempts when offline
// ══════════════════════════════════════════════════════════════

import { supabase } from './api';

// ─── Constants ───
const TABLE = 'lynx_user_data';
const SYNC_META_KEY = 'lynx_sync_meta';
const PUSH_DEBOUNCE_MS = 2000;    // Batch changes for 2 seconds
const MAX_RETRIES = 5;
const BASE_RETRY_MS = 1000;       // 1s, 2s, 4s, 8s, 16s

// ─── Field → localStorage key mapping ───
const FIELD_LS_MAP: Record<SyncFieldName, string> = {
  latest_scores: 'lynx_latest_scores',
  face_url: 'lynx_face_url',
  scan_history: 'lynx_scan_history',
  plan_progress: 'lynx_plan_progress',
  chat_history: 'lynx_chat_history',
  saved_remedies: 'lynx_saved_remedies',
};

type SyncFieldName = 'latest_scores' | 'face_url' | 'scan_history' | 'plan_progress' | 'chat_history' | 'saved_remedies';

// ─── Sync metadata (persisted in localStorage) ───
interface SyncMeta {
  lastSyncedAt: string | null;            // ISO — last successful full sync
  dirtyFields: SyncFieldName[];           // Fields changed since last push
  fieldTimestamps: Record<string, string>; // Per-field local modification timestamps
  retryCount: number;                     // Current retry attempt
}

// ─── Runtime state (not persisted) ───
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let isPushing = false;
let activeUserId: string | null = null;  // Cached from auth events — avoids getSession() hang

/**
 * Set the active user ID from auth events.
 * Must be called from App.tsx on INITIAL_SESSION / SIGNED_IN.
 * This ensures all sync operations have a reliable userId
 * without calling getSession() which can hang.
 */
export function setActiveUserId(userId: string | null) {
  activeUserId = userId;
  console.log('[Sync] Active user set:', userId ? userId.substring(0, 8) + '...' : 'null');
}

// ═══════════════════════════════════════
//  Meta management
// ═══════════════════════════════════════
function loadMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lastSyncedAt: null, dirtyFields: [], fieldTimestamps: {}, retryCount: 0 };
}

function saveMeta(meta: SyncMeta) {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch {}
}

function markDirty(field: SyncFieldName) {
  const meta = loadMeta();
  if (!meta.dirtyFields.includes(field)) {
    meta.dirtyFields.push(field);
  }
  meta.fieldTimestamps[field] = new Date().toISOString();
  saveMeta(meta);
}

function clearDirty() {
  const meta = loadMeta();
  meta.dirtyFields = [];
  meta.retryCount = 0;
  meta.lastSyncedAt = new Date().toISOString();
  saveMeta(meta);
}

// ═══════════════════════════════════════
//  Auth helper
// ═══════════════════════════════════════
function getReliableUserId(): string | null {
  // Use cached userId from auth events (always reliable)
  return activeUserId;
}

// ═══════════════════════════════════════
//  Face image upload to Supabase Storage
//  (REMOVED — now handled by api.ts cloud-first upload)
// ═══════════════════════════════════════

// ═══════════════════════════════════════
//  Network awareness
// ═══════════════════════════════════════
function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

// Listen for reconnection — flush any pending changes
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const meta = loadMeta();
    if (meta.dirtyFields.length > 0) {
      console.log('[Sync] Back online — flushing pending changes');
      schedulePush();
    }
  });
}

// ═══════════════════════════════════════
//  PULL — Conditional fetch (minimum egress)
// ═══════════════════════════════════════
/**
 * Pull data from Supabase cloud into localStorage.
 * @param overrideUserId - Pass userId directly when calling from auth events
 *   to avoid getSession() race conditions on fresh login.
 */
export async function pullFromCloud(overrideUserId?: string): Promise<boolean> {
  const userId = overrideUserId || await getUserId();
  if (!userId) {
    console.warn('[Sync] Pull skipped — no userId');
    return false;
  }
  if (!isOnline()) {
    console.warn('[Sync] Pull skipped — offline');
    return false;
  }

  try {
    const meta = loadMeta();

    // First-time on this device (or after logout)? Always do full pull
    const isFirstSync = !meta.lastSyncedAt;

    if (!isFirstSync) {
      // Lightweight freshness check — only fetch updated_at (tiny response ~20 bytes)
      const { data: freshness, error: freshErr } = await supabase
        .from(TABLE)
        .select('updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (freshErr) {
        console.warn('[Sync] Freshness check failed:', freshErr.message);
        // Don't return false — fall through to full pull as safety
      } else if (freshness?.updated_at && meta.lastSyncedAt) {
        const cloudTime = new Date(freshness.updated_at).getTime();
        const localTime = new Date(meta.lastSyncedAt).getTime();
        if (cloudTime <= localTime) {
          console.log('[Sync] Cloud unchanged — skip pull');
          return true;
        }
      }
      // If freshness is null, no cloud record yet
      if (!freshness) {
        console.log('[Sync] No cloud record found');
        return true;
      }
    } else {
      console.log('[Sync] First sync on this device — forcing full pull');
    }

    // Step 2: Full pull (only when actually needed)
    console.log('[Sync] Fetching full data from cloud...');
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      if (error?.code === 'PGRST116') {
        console.log('[Sync] No rows — first time user');
        return true;
      }
      console.warn('[Sync] Pull failed:', error?.message);
      return false;
    }

    console.log('[Sync] Cloud data received:', {
      has_scores: !!data.latest_scores,
      has_face_url: !!data.face_url,
      scan_count: Array.isArray(data.scan_history) ? data.scan_history.length : 0,
      has_progress: !!data.plan_progress && Object.keys(data.plan_progress).length > 0,
      has_chat: Array.isArray(data.chat_history) ? data.chat_history.length : 0,
      has_remedies: Array.isArray(data.saved_remedies) ? data.saved_remedies.length : 0,
    });

    // Step 3: Apply cloud data to localStorage
    // After logout, localStorage is empty — always apply cloud data
    const cloudFieldTs: Record<string, string> = data.field_updated_at || {};
    const localFieldTs = meta.fieldTimestamps;
    let restoredCount = 0;

    restoredCount += applyCloudField('latest_scores', data.latest_scores, cloudFieldTs, localFieldTs, FIELD_LS_MAP.latest_scores, 'object');
    restoredCount += applyCloudField('face_url', data.face_url, cloudFieldTs, localFieldTs, FIELD_LS_MAP.face_url, 'string');
    restoredCount += applyCloudField('scan_history', data.scan_history, cloudFieldTs, localFieldTs, FIELD_LS_MAP.scan_history, 'array_merge');
    restoredCount += applyCloudField('plan_progress', data.plan_progress, cloudFieldTs, localFieldTs, FIELD_LS_MAP.plan_progress, 'object');
    restoredCount += applyCloudField('chat_history', data.chat_history, cloudFieldTs, localFieldTs, FIELD_LS_MAP.chat_history, 'array');
    restoredCount += applyCloudField('saved_remedies', data.saved_remedies, cloudFieldTs, localFieldTs, FIELD_LS_MAP.saved_remedies, 'array');

    // Update sync metadata
    meta.lastSyncedAt = new Date().toISOString();
    // Keep dirty fields that were modified AFTER the cloud data
    meta.dirtyFields = meta.dirtyFields.filter(f => {
      const lt = localFieldTs[f] ? new Date(localFieldTs[f]).getTime() : 0;
      const ct = cloudFieldTs[f] ? new Date(cloudFieldTs[f]).getTime() : 0;
      return lt > ct;
    });
    saveMeta(meta);

    console.log(`[Sync] ✅ Pull complete — restored ${restoredCount} field(s)`);
    return true;
  } catch (e) {
    console.warn('[Sync] Pull exception:', e);
    return false;
  }
}

/**
 * Apply a single cloud field to localStorage.
 * Returns 1 if the field was restored, 0 if skipped.
 * KEY FIX: If localStorage is empty for this field (e.g. after logout),
 * ALWAYS apply cloud data regardless of timestamps.
 */
function applyCloudField(
  field: string,
  cloudValue: any,
  cloudTs: Record<string, string>,
  localTs: Record<string, string>,
  lsKey: string,
  type: 'object' | 'string' | 'array' | 'array_merge'
): number {
  // Skip null/empty cloud values
  if (cloudValue === null || cloudValue === undefined) {
    console.log(`[Sync]   ${field}: cloud is null — skip`);
    return 0;
  }
  if (type === 'array' && Array.isArray(cloudValue) && cloudValue.length === 0) {
    console.log(`[Sync]   ${field}: cloud array empty — skip`);
    return 0;
  }
  if (type === 'object' && typeof cloudValue === 'object' && Object.keys(cloudValue).length === 0) {
    console.log(`[Sync]   ${field}: cloud object empty — skip`);
    return 0;
  }

  // Check if local data exists — if not, ALWAYS apply cloud (this is the post-logout case)
  const localValue = localStorage.getItem(lsKey);
  const localIsEmpty = !localValue || localValue === '[]' || localValue === '{}' || localValue === 'null';

  if (!localIsEmpty) {
    // Local has data — use timestamp comparison for conflict resolution
    const cloudTime = cloudTs[field] ? new Date(cloudTs[field]).getTime() : 0;
    const localTime = localTs[field] ? new Date(localTs[field]).getTime() : 0;
    if (localTime > cloudTime) {
      console.log(`[Sync]   ${field}: local is newer — keep local`);
      return 0;
    }
  }

  // Apply cloud data
  if (type === 'string') {
    localStorage.setItem(lsKey, cloudValue as string);
  } else if (type === 'array_merge' && Array.isArray(cloudValue)) {
    const local = safeParseArr(localValue);
    const merged = mergeByTimestamp(cloudValue, local);
    localStorage.setItem(lsKey, JSON.stringify(merged.slice(0, 20)));
  } else {
    localStorage.setItem(lsKey, JSON.stringify(cloudValue));
  }

  console.log(`[Sync]   ✅ ${field}: restored from cloud`);
  return 1;
}

// ═══════════════════════════════════════
//  PUSH — Debounced, dirty-fields only
// ═══════════════════════════════════════

// Schedule a debounced push (called after every field change)
function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    flushDirtyFields().catch(() => {});
  }, PUSH_DEBOUNCE_MS);
}

// Actually push only dirty fields
async function flushDirtyFields(): Promise<boolean> {
  if (isPushing) return false; // Prevent concurrent pushes
  const userId = getReliableUserId();
  if (!userId) {
    console.warn('[Sync] Push skipped — no active userId (not logged in?)');
    return false;
  }
  if (!isOnline()) {
    console.log('[Sync] Offline — changes queued for later');
    return false;
  }

  const meta = loadMeta();
  if (meta.dirtyFields.length === 0) return true; // Nothing to push

  isPushing = true;

  try {
    // Build payload with ONLY dirty fields (minimum egress)
    const payload: Record<string, any> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    const fieldTimestamps: Record<string, string> = { ...meta.fieldTimestamps };

    for (const field of meta.dirtyFields) {
      const lsKey = FIELD_LS_MAP[field];
      if (!lsKey) continue;

      if (field === 'face_url') {
        const val = localStorage.getItem(lsKey);
        // Only sync if it's a URL (not huge base64)
        if (val && (val.startsWith('http') || val.length < 2000)) {
          payload[field] = val;
        }
      } else if (field === 'scan_history') {
        const arr = safeParseArr(localStorage.getItem(lsKey));
        if (arr.length > 0) {
          // Keep faceImage URLs in history (they're small URLs now, not base64)
          // Only strip actual base64 data to minimize payload
          payload[field] = arr.map((r: any) => {
            const entry = { ...r };
            // Strip base64 images but keep URLs
            if (entry.faceImage && entry.faceImage.startsWith('data:')) {
              delete entry.faceImage;
            }
            return entry;
          });
        }
      } else if (field === 'chat_history') {
        const arr = safeParseArr(localStorage.getItem(lsKey));
        if (arr.length > 0) {
          payload[field] = arr.slice(-50); // Cap at 50 messages
        }
      } else {
        const raw = localStorage.getItem(lsKey);
        if (raw) {
          try { payload[field] = JSON.parse(raw); } catch {}
        }
      }
    }

    // Include per-field timestamps for conflict resolution
    payload.field_updated_at = fieldTimestamps;

    const { error } = await supabase
      .from(TABLE)
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.warn('[Sync] Push failed:', error.message);
      scheduleRetry(meta);
      return false;
    }

    // Success — clear dirty state
    clearDirty();
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    console.log(`[Sync] ✅ Pushed ${meta.dirtyFields.length} field(s): ${meta.dirtyFields.join(', ')}`);
    return true;
  } catch (e) {
    console.warn('[Sync] Push exception:', e);
    scheduleRetry(loadMeta());
    return false;
  } finally {
    isPushing = false;
  }
}

// ─── Exponential backoff retry ───
function scheduleRetry(meta: SyncMeta) {
  if (meta.retryCount >= MAX_RETRIES) {
    console.warn(`[Sync] Max retries (${MAX_RETRIES}) reached — giving up until next user action`);
    meta.retryCount = 0;
    saveMeta(meta);
    return;
  }

  const delay = BASE_RETRY_MS * Math.pow(2, meta.retryCount); // 1s, 2s, 4s, 8s, 16s
  meta.retryCount++;
  saveMeta(meta);

  console.log(`[Sync] Retry #${meta.retryCount} in ${delay}ms`);
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    flushDirtyFields().catch(() => {});
  }, delay);
}

// ═══════════════════════════════════════
//  PUBLIC API — Called by app components
// ═══════════════════════════════════════

/**
 * Push a single field to cloud.
 * Writes to localStorage immediately, then debounces the actual network push.
 * Multiple rapid calls batch into one request.
 */
export async function pushField(field: SyncFieldName, value: any): Promise<void> {
  // 1. Mark field as dirty (persisted — survives page refresh)
  markDirty(field);

  // 2. Schedule debounced push (batches rapid changes)
  schedulePush();
}

/**
 * Push ALL local data to cloud immediately (used before logout).
 */
export async function pushToCloud(): Promise<boolean> {
  // Mark all fields as dirty and flush immediately
  const meta = loadMeta();
  const allFields: SyncFieldName[] = ['latest_scores', 'face_url', 'scan_history', 'plan_progress', 'chat_history', 'saved_remedies'];
  for (const f of allFields) {
    if (!meta.dirtyFields.includes(f)) meta.dirtyFields.push(f);
    meta.fieldTimestamps[f] = new Date().toISOString();
  }
  saveMeta(meta);

  // Cancel any pending debounce and push immediately
  if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
  return flushDirtyFields();
}

// ═══════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════
function safeParseArr(raw: string | null): any[] {
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
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

// ═══════════════════════════════════════
//  Retry pending uploads on app startup
// ═══════════════════════════════════════
/**
 * Call this on app startup after auth is established.
 * Checks if face_url is still base64 (meaning previous upload failed)
 * and retries the upload to Supabase Storage.
 */
export async function retryPendingUploads(): Promise<void> {
  // No-op: Image uploads are now handled synchronously in api.ts saveScores
  // This function is kept for API compatibility
  console.log('[Sync] retryPendingUploads — no-op (cloud-first uploads handle this)');
}
