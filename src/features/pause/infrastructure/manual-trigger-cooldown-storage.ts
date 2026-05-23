/** Home manual “Need a moment” cooldown timestamp in localStorage (ms since epoch). */

export function readManualTriggerCooldownAtMs(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export function writeManualTriggerCooldownAtMs(key: string, atMs: number): void {
  try {
    localStorage.setItem(key, String(atMs));
  } catch {
    /* ignore */
  }
}
