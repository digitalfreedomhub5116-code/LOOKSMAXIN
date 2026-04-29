/**
 * SessionGuard — Single-device session enforcement.
 *
 * How it works:
 * 1. On login, generate a unique device token (UUID) and store it in:
 *    - localStorage (this device)
 *    - Supabase user_metadata.active_device_token (server truth)
 * 2. Poll every 30s: fetch the server's active_device_token
 * 3. If server token ≠ local token → another device logged in → force sign out
 *
 * This ensures only ONE device can be logged in at a time.
 * The new device always wins — the old device gets kicked automatically.
 *
 * KEY FIX: On INITIAL_SESSION (page reload / app start), we REUSE the existing
 * device token instead of generating a new one. A new token is only generated
 * on an actual SIGNED_IN event (fresh login). This prevents the guard from
 * kicking users out on every page refresh or after brief network hiccups.
 */
import { supabase } from './api';

const LS_DEVICE_TOKEN = 'lynx_device_token';
const POLL_INTERVAL_MS = 30_000; // Check every 30 seconds (was 10s — too aggressive)
const INITIAL_GRACE_MS = 15_000; // Wait 15s after login before starting checks

let guardInterval: ReturnType<typeof setInterval> | null = null;
let graceTimer: ReturnType<typeof setTimeout> | null = null;

/** Generate a random device token */
function generateToken(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Register this device as the active session.
 * - On fresh login (SIGNED_IN): generates a NEW token.
 * - On page reload (INITIAL_SESSION): REUSES existing token if present.
 *
 * Writes the token to Supabase user_metadata so other devices see it.
 */
export async function registerDeviceSession(forceNewToken = false): Promise<void> {
  const existingToken = localStorage.getItem(LS_DEVICE_TOKEN);

  // Reuse existing token unless this is a fresh login or forced
  const token = (forceNewToken || !existingToken) ? generateToken() : existingToken;
  localStorage.setItem(LS_DEVICE_TOKEN, token);

  // Only write to server if we generated a NEW token
  // (avoids unnecessary updateUser calls on every page load)
  if (forceNewToken || !existingToken) {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { active_device_token: token },
      });
      if (error) {
        console.warn('[SessionGuard] Failed to register device token:', error.message);
        // Don't clear local token — the guard will just skip checks
        // until the token is successfully written
      } else {
        console.log('[SessionGuard] ✅ Registered device token:', token.slice(0, 8) + '…');
      }
    } catch (err) {
      console.warn('[SessionGuard] Failed to register device token:', err);
    }
  } else {
    console.log('[SessionGuard] ♻️ Reusing existing device token:', token.slice(0, 8) + '…');
  }
}

/**
 * Start polling the server to verify this device is still the active one.
 * If another device has taken over, this device will be signed out.
 *
 * Includes a grace period after login to let the updateUser call propagate
 * before we start checking — prevents false positives for new users.
 */
export function startSessionGuard(): void {
  // Clear any existing guard
  stopSessionGuard();

  // Grace period: don't check immediately after login
  // This gives the updateUser call time to propagate
  graceTimer = setTimeout(() => {
    graceTimer = null;

    guardInterval = setInterval(async () => {
      const localToken = localStorage.getItem(LS_DEVICE_TOKEN);
      if (!localToken) return; // No token — not logged in

      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return; // Auth error — skip this cycle

        const serverToken = user.user_metadata?.active_device_token;
        if (!serverToken) return; // Server has no token yet — skip

        if (serverToken !== localToken) {
          console.warn('[SessionGuard] ⛔ Session taken by another device. Signing out…');
          stopSessionGuard();
          localStorage.removeItem(LS_DEVICE_TOKEN);
          await supabase.auth.signOut();
          // The SIGNED_OUT event in App.tsx will handle the UI redirect
        }
      } catch (err) {
        // Network errors are fine — just skip this check
        console.debug('[SessionGuard] Check failed (network?):', err);
      }
    }, POLL_INTERVAL_MS);

    console.log('[SessionGuard] 🔒 Guard started (polling every', POLL_INTERVAL_MS / 1000, 's)');
  }, INITIAL_GRACE_MS);

  console.log('[SessionGuard] ⏳ Grace period:', INITIAL_GRACE_MS / 1000, 's before guard activates');
}

/**
 * Stop the session guard polling.
 * Call on logout or component unmount.
 */
export function stopSessionGuard(): void {
  if (graceTimer) {
    clearTimeout(graceTimer);
    graceTimer = null;
  }
  if (guardInterval) {
    clearInterval(guardInterval);
    guardInterval = null;
  }
}

/**
 * Clean up device token from localStorage.
 * Call on explicit logout.
 */
export function clearDeviceToken(): void {
  localStorage.removeItem(LS_DEVICE_TOKEN);
}
