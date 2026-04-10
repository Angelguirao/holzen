const MANUAL_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes for on-demand
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
