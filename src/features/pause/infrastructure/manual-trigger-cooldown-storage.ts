/** Home manual “Need a moment” cooldown timestamp in localStorage (ms since epoch).
 *  Key: `holzen_last_manual_at_${userId}` — see `buildManualTriggerCooldownStorageKey`.
 *  Only stamped when a manual open succeeds; cron/automatic pauses do not reset it. */

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
