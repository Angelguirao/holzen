const MANUAL_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour for on-demand manual pauses
const DEV_COOLDOWN_MS = 5 * 1000; // 5 seconds in dev mode

/** localStorage flag synced from DB via Admin page */
export function isHolzenDevMode(): boolean {
  try {
    return localStorage.getItem('holzen_dev_mode') === 'true';
  } catch {
    return false;
  }
}

export function getManualReflectionCooldownMs(): number {
  return isHolzenDevMode() ? DEV_COOLDOWN_MS : MANUAL_COOLDOWN_MS;
}
