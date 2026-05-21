import { describe, expect, it } from 'vitest';
import {
  buildManualTriggerCooldownStorageKey,
  isManualTriggerBlockedByCooldown,
  parseManualTriggerCooldownFromStorageEvent,
} from './manual-trigger-cooldown-flow';

describe('manual-trigger-cooldown-flow', () => {
  it('builds per-user cooldown key', () => {
    expect(buildManualTriggerCooldownStorageKey('user-1')).toBe('holzen_last_manual_at_user-1');
    expect(buildManualTriggerCooldownStorageKey(undefined)).toBe('holzen_last_manual_at');
  });

  it('blocks when cooldown remaining is positive', () => {
    expect(isManualTriggerBlockedByCooldown(1000)).toBe(true);
    expect(isManualTriggerBlockedByCooldown(0)).toBe(false);
  });

  it('parses storage events for the manual cooldown key', () => {
    const key = 'holzen_last_manual_at_user-1';
    expect(
      parseManualTriggerCooldownFromStorageEvent(
        { key: 'other', storageArea: 'localStorage', newValue: '1' },
        key,
      ),
    ).toBe('ignore');
    expect(
      parseManualTriggerCooldownFromStorageEvent(
        { key, storageArea: 'localStorage', newValue: '12345' },
        key,
      ),
    ).toBe(12345);
    expect(
      parseManualTriggerCooldownFromStorageEvent(
        { key, storageArea: 'localStorage', newValue: null },
        key,
      ),
    ).toBeNull();
  });
});
