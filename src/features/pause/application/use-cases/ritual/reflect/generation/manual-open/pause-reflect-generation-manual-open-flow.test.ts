import { describe, expect, it } from 'vitest';

import {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  dismissOpenPauseHome,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  openManualPauseFromHome,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
} from './pause-reflect-generation-manual-open-flow';

describe('pause-reflect-generation-manual-open-flow', () => {
  it('re-exports manual-open domain builders and Home use cases from siblings', () => {
    expect(typeof buildManualPauseCreateOrReuseParams).toBe('function');
    expect(typeof buildManualPauseOpenParams).toBe('function');
    expect(typeof buildManualPauseMarketContext).toBe('function');
    expect(typeof MANUAL_PAUSE_VOLATILITY_TEMPLATE).toBe('string');
    expect(typeof dismissOpenPauseHome).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof runOpenManualPauseSilentModeAfterCreate).toBe('function');
    expect(typeof runPersistSilentReflectionStub).toBe('function');
  });
});
