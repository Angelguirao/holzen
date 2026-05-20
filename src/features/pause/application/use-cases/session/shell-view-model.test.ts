import { describe, expect, it } from 'vitest';
import type { PauseSessionHydrationReady } from '@/features/pause/public';
import { coalescePauseSessionShellViewModel } from '@/features/pause/public';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/features/pause/domain/session-model';

const ready = (over: Partial<PauseSessionHydrationReady> = {}): PauseSessionHydrationReady => ({
  status: 'ready',
  message: 'hello',
  context: 'ctx',
  pauseInstanceId: 'pi-1',
  companions: {
    haiku: 'h',
    groundingTitle: 'gt',
    groundingBody: 'gb',
  },
  companionPrefs: { ...DEFAULT_PREFS, haiku: false },
  severity: 'moderate',
  ...over,
});

describe('coalescePauseSessionShellViewModel', () => {
  it('uses Holzen severity and defaults when resolved is null', () => {
    const vm = coalescePauseSessionShellViewModel(null, 'high');
    expect(vm.message).toBe('');
    expect(vm.context).toBeNull();
    expect(vm.pauseInstanceId).toBeNull();
    expect(vm.companions).toEqual(DEFAULT_COMPANIONS);
    expect(vm.companionPrefs).toEqual(DEFAULT_PREFS);
    expect(vm.severity).toBe('high');
  });

  it('uses resolved fields when present', () => {
    const r = ready({ severity: 'mild' });
    const vm = coalescePauseSessionShellViewModel(r, 'high');
    expect(vm.message).toBe('hello');
    expect(vm.context).toBe('ctx');
    expect(vm.pauseInstanceId).toBe('pi-1');
    expect(vm.companions).toEqual(r.companions);
    expect(vm.companionPrefs).toEqual(r.companionPrefs);
    expect(vm.severity).toBe('mild');
  });
});
