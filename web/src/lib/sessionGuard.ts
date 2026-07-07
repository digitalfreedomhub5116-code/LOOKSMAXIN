/**
 * SessionGuard — DISABLED
 * 
 * Previously enforced single-device sessions by polling server tokens.
 * This caused unexpected logouts during scans and normal usage.
 * All functions are now no-ops to prevent any forced logouts.
 */

export async function registerDeviceSession(_forceNewToken = false): Promise<void> {
  // No-op: session guard disabled
}

export function startSessionGuard(): void {
  // No-op: session guard disabled
}

export function stopSessionGuard(): void {
  // No-op: session guard disabled
}

export function clearDeviceToken(): void {
  // Clean up any leftover token from localStorage
  try { localStorage.removeItem('lynx_device_token'); } catch {}
}
