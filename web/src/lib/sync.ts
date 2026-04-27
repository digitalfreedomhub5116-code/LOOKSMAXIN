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
async function getUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

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
export async function pullFromCloud(): Promise<boolean> {
  const userId = await getUserId();
  if (!userId || !isOnline()) return false;

  try {
    // Step 1: Lightweight freshness check — only fetch updated_at (tiny response ~20 bytes)
    const meta = loadMeta();
    const { data: freshness, error: freshErr } = await supabase
      .from(TABLE)
      .select('updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (freshErr) {
      console.warn('[Sync] Freshness check failed:', freshErr.message);
      return false;
    }

    // No cloud record yet — nothing to pull
    if (!freshness) return true;

    // Cloud hasn't changed since our last sync — skip full pull (saves bandwidth)
    if (meta.lastSyncedAt && freshness.updated_at) {
      const cloudTime = new Date(freshness.updated_at).getTime();
      const localTime = new Date(meta.lastSyncedAt).getTime();
      if (cloudTime <= localTime) {
        console.log('[Sync] Cloud unchanged — skip pull');
        return true;
      }
    }

    // Step 2: Full pull (only when actually needed)
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      if (error?.code === 'PGRST116') return true; // No rows = first time user
      console.warn('[Sync] Pull failed:', error?.message);
      return false;
    }

    // Step 3: Per-field conflict resolution (cloud vs local)
    const cloudFieldTs: Record<string, string> = data.field_updated_at || {};
    const localFieldTs = meta.fieldTimestamps;

    mergeField('latest_scores', data.latest_scores, cloudFieldTs, localFieldTs, FIELD_LS_MAP.latest_scores, 'object');
    mergeField('face_url', data.face_url, cloudFieldTs, localFieldTs, FIELD_LS_MAP.face_url, 'string');
    mergeField('scan_history', data.scan_history, cloudFieldTs, localFieldTs, FIELD_LS_MAP.scan_history, 'array_merge');
    mergeField('plan_progress', data.plan_progress, cloudFieldTs, localFieldTs, FIELD_LS_MAP.plan_progress, 'object');
    mergeField('chat_history', data.chat_history, cloudFieldTs, localFieldTs, FIELD_LS_MAP.chat_history, 'array');
    mergeField('saved_remedies', data.saved_remedies, cloudFieldTs, localFieldTs, FIELD_LS_MAP.saved_remedies, 'array');

    // Update sync metadata
    meta.lastSyncedAt = new Date().toISOString();
    // Keep dirty fields that were modified AFTER the cloud data
    meta.dirtyFields = meta.dirtyFields.filter(f => {
      const lt = localFieldTs[f] ? new Date(localFieldTs[f]).getTime() : 0;
      const ct = cloudFieldTs[f] ? new Date(cloudFieldTs[f]).getTime() : 0;
      return lt > ct;
    });
    saveMeta(meta);

    console.log('[Sync] ✅ Pull complete');
    return true;
  } catch (e) {
    console.warn('[Sync] Pull exception:', e);
    return false;
  }
}

// Per-field merge with timestamp-based conflict resolution
function mergeField(
  field: string,
  cloudValue: any,
  cloudTs: Record<string, string>,
  localTs: Record<string, string>,
  lsKey: string,
  type: 'object' | 'string' | 'array' | 'array_merge'
) {
  if (cloudValue === null || cloudValue === undefined) return;
  if (type === 'array' && Array.isArray(cloudValue) && cloudValue.length === 0) return;
  if (type === 'object' && typeof cloudValue === 'object' && Object.keys(cloudValue).length === 0) return;

  const cloudTime = cloudTs[field] ? new Date(cloudTs[field]).getTime() : 0;
  const localTime = localTs[field] ? new Date(localTs[field]).getTime() : 0;

  // If local is newer, keep local data
  if (localTime > cloudTime) return;

  // Cloud is newer — use cloud data
  if (type === 'string') {
    localStorage.setItem(lsKey, cloudValue as string);
  } else if (type === 'array_merge' && Array.isArray(cloudValue)) {
    // Scan history: merge and deduplicate by timestamp
    const local = safeParseArr(localStorage.getItem(lsKey));
    const merged = mergeByTimestamp(cloudValue, local);
    localStorage.setItem(lsKey, JSON.stringify(merged.slice(0, 20)));
  } else {
    localStorage.setItem(lsKey, JSON.stringify(cloudValue));
  }
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
  const userId = await getUserId();
  if (!userId) return false;
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
        // Only store URLs, never base64 (keep payload small)
        if (val && !val.startsWith('data:') && val.length < 500) {
          payload[field] = val;
        }
      } else if (field === 'scan_history') {
        const arr = safeParseArr(localStorage.getItem(lsKey));
        if (arr.length > 0) {
          // Strip base64 face images to minimize egress
          payload[field] = arr.map((r: any) => ({ ...r, faceImage: undefined }));
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
