/**
 * SessionGuard — Single-device session enforcement.
 *
 * How it works:
 * 1. On login, generate a unique device token (UUID) and store it in:
 *    - localStorage (this device)
 *    - Supabase user_metadata.active_device_token (server truth)
 * 2. Poll every 10s: fetch the server's active_device_token
 * 3. If server token ≠ local token → another device logged in → force sign out
 *
 * This ensures only ONE device can be logged in at a time.
 * The new device always wins — the old device gets kicked automatically.
 */
import { supabase } from './api';

const LS_DEVICE_TOKEN = 'lynx_device_token';
const POLL_INTERVAL_MS = 10_000; // Check every 10 seconds

let guardInterval: ReturnType<typeof setInterval> | null = null;

/** Generate a random device token */
function generateToken(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Register this device as the active session.
 * Call this immediately after successful login / session restore.
 * Writes the token to Supabase user_metadata so other devices see it.
 */
export async function registerDeviceSession(): Promise<void> {
  const token = generateToken();
  localStorage.setItem(LS_DEVICE_TOKEN, token);

  try {
    await supabase.auth.updateUser({
      data: { active_device_token: token },
    });
    console.log('[SessionGuard] ✅ Registered device token:', token.slice(0, 8) + '…');
  } catch (err) {
    console.warn('[SessionGuard] Failed to register device token:', err);
  }
}

/**
 * Start polling the server to verify this device is still the active one.
 * If another device has taken over, this device will be signed out.
 */
export function startSessionGuard(): void {
  // Clear any existing guard
  stopSessionGuard();

  guardInterval = setInterval(async () => {
    const localToken = localStorage.getItem(LS_DEVICE_TOKEN);
    if (!localToken) return; // No token — not logged in

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
}

/**
 * Stop the session guard polling.
 * Call on logout or component unmount.
 */
export function stopSessionGuard(): void {
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
