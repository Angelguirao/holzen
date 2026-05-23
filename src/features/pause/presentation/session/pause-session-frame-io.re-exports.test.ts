import { describe, expect, it } from 'vitest';

import { initialFrameDoneFromRestored as initialFrameDoneDirect } from '@/features/pause/application/use-cases/ritual/frame/restored-frame-ritual-state';

import { initialFrameDoneFromRestored } from './pause-session-frame-io';

describe('pause-session-frame-io re-exports', () => {
  it('re-exports frame hydration with identity binding to restored-frame-ritual-state leaf module', () => {
    expect(initialFrameDoneFromRestored).toBe(initialFrameDoneDirect);
  });
});
