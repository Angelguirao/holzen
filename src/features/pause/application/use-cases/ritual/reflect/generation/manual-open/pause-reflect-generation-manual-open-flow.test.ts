import { describe, expect, it } from 'vitest';

import {
  buildManualPauseCreateOrReuseParams,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
} from '@/features/pause/domain/reflect/generation/build-manual-pause-create-or-reuse-params';
import {
  buildManualPauseMarketContext,
} from '@/features/pause/domain/reflect/generation/build-manual-pause-market-context';
import {
  buildManualPauseOpenParams,
} from '@/features/pause/domain/reflect/generation/build-manual-pause-open-params';

import { dismissOpenPauseHome as dismissDirect } from './dismiss-open-pause-home';
import { openManualPauseFromHome as openManualDirect } from './open-manual-pause-from-home';
import {
  buildManualPauseCreateOrReuseParams as buildCreateOrReuseFromFlow,
  buildManualPauseMarketContext as buildMarketFromFlow,
  buildManualPauseOpenParams as buildOpenFromFlow,
  dismissOpenPauseHome,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE as volatilityTemplateFromFlow,
  openManualPauseFromHome,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
} from './pause-reflect-generation-manual-open-flow';
import { runOpenManualPauseSilentModeAfterCreate as runSilentModeDirect } from './run-open-manual-pause-silent-mode-after-create';
import { runPersistSilentReflectionStub as runPersistStubDirect } from './run-persist-silent-reflection-stub';
import {
  buildManualPauseCreateOrReuseParams as buildCreateOrReuseFromGenerationFlow,
  buildManualPauseMarketContext as buildMarketFromGenerationFlow,
  buildManualPauseOpenParams as buildOpenFromGenerationFlow,
  dismissOpenPauseHome as dismissFromGenerationFlow,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE as volatilityTemplateFromGenerationFlow,
  openManualPauseFromHome as openManualFromGenerationFlow,
  runOpenManualPauseSilentModeAfterCreate as runSilentModeFromGenerationFlow,
  runPersistSilentReflectionStub as runPersistStubFromGenerationFlow,
} from '../pause-reflect-generation-flow';

describe('pause-reflect-generation-manual-open-flow', () => {
  it('re-exports manual-open domain builders and Home use cases from siblings', () => {
    expect(typeof buildCreateOrReuseFromFlow).toBe('function');
    expect(typeof buildOpenFromFlow).toBe('function');
    expect(typeof buildMarketFromFlow).toBe('function');
    expect(typeof volatilityTemplateFromFlow).toBe('string');
    expect(typeof dismissOpenPauseHome).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof runOpenManualPauseSilentModeAfterCreate).toBe('function');
    expect(typeof runPersistSilentReflectionStub).toBe('function');

    expect(buildCreateOrReuseFromFlow).toBe(buildManualPauseCreateOrReuseParams);
    expect(buildOpenFromFlow).toBe(buildManualPauseOpenParams);
    expect(buildMarketFromFlow).toBe(buildManualPauseMarketContext);
    expect(volatilityTemplateFromFlow).toBe(MANUAL_PAUSE_VOLATILITY_TEMPLATE);
    expect(dismissOpenPauseHome).toBe(dismissDirect);
    expect(openManualPauseFromHome).toBe(openManualDirect);
    expect(runOpenManualPauseSilentModeAfterCreate).toBe(runSilentModeDirect);
    expect(runPersistSilentReflectionStub).toBe(runPersistStubDirect);
  });

  it('manual-open subcluster bindings match generation presentation umbrella (leaf parity)', () => {
    expect(buildCreateOrReuseFromFlow).toBe(buildCreateOrReuseFromGenerationFlow);
    expect(buildOpenFromFlow).toBe(buildOpenFromGenerationFlow);
    expect(buildMarketFromFlow).toBe(buildMarketFromGenerationFlow);
    expect(volatilityTemplateFromFlow).toBe(volatilityTemplateFromGenerationFlow);
    expect(dismissOpenPauseHome).toBe(dismissFromGenerationFlow);
    expect(openManualPauseFromHome).toBe(openManualFromGenerationFlow);
    expect(runOpenManualPauseSilentModeAfterCreate).toBe(runSilentModeFromGenerationFlow);
    expect(runPersistSilentReflectionStub).toBe(runPersistStubFromGenerationFlow);
  });
});
