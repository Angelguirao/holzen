export type ManualTriggerCooldownStorageEvent = {
  key: string | null;
  storageArea: string | null;
  newValue: string | null;
};

export function buildManualTriggerCooldownStorageKey(userId: string | undefined): string {
  return userId ? `holzen_last_manual_at_${userId}` : 'holzen_last_manual_at';
}

export function isManualTriggerBlockedByCooldown(remainingMs: number): boolean {
  return remainingMs > 0;
}

/** Cross-tab sync when another tab updates the manual cooldown key. */
export function parseManualTriggerCooldownFromStorageEvent(
  event: ManualTriggerCooldownStorageEvent,
  expectedKey: string,
): number | null | 'ignore' {
  if (event.key !== expectedKey || event.storageArea !== 'localStorage') return 'ignore';
  return event.newValue ? Number(event.newValue) : null;
}
