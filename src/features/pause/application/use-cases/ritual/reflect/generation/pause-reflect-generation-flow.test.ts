import { describe, expect, it } from 'vitest';

import {
  buildManualPauseCreateOrReuseParams,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
} from '@/features/pause/domain/reflect/generation/build-manual-pause-create-or-reuse-params';
import { buildManualPauseOpenParams as buildOpenParamsDirect } from '@/features/pause/domain/reflect/generation/build-manual-pause-open-params';
import { buildManualPauseMarketContext as buildMarketContextDirect } from '@/features/pause/domain/reflect/generation/build-manual-pause-market-context';
import {
  messageFromReflectGenerationResult,
  resolveReflectGenerationPrefetch,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from '@/features/pause/domain/reflect/generation/reflect-generation-hook-flow';
import { reflectGenerationPrerequisite } from '@/features/pause/domain/reflect/generation/reflect-generation-prerequisites';
import { reflectGenerationUserErrorMessage } from '@/features/pause/domain/reflect/generation/reflect-generation-errors';
import { resolveEffectiveReflectionCopy } from '@/features/pause/domain/reflect/generation/resolve-effective-reflection-copy';

import {
  messageFromReflectGenerationResult as messageFromResultFromHookFlow,
  reflectGenerationPrerequisite as prerequisiteFromHookFlow,
  reflectGenerationUserErrorMessage as userErrorFromHookFlow,
  resolveEffectiveReflectionCopy as resolveCopyFromHookFlow,
  resolveReflectGenerationPrefetch as resolvePrefetchFromHookFlow,
  runReflectGeneration as runReflectGenerationFromHookFlow,
  shouldClearReflectGenerationLoading as shouldClearLoadingFromHookFlow,
  shouldCommitReflectGeneration as shouldCommitFromHookFlow,
} from './holzen-reflect/pause-reflect-generation-hook-flow';
import {
  buildManualPauseCreateOrReuseParams as buildCreateOrReuseFromManualOpenFlow,
  buildManualPauseMarketContext as buildMarketContextFromManualOpenFlow,
  buildManualPauseOpenParams as buildOpenParamsFromManualOpenFlow,
  dismissOpenPauseHome as dismissFromManualOpenFlow,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE as volatilityTemplateFromManualOpenFlow,
  openManualPauseFromHome as openManualFromManualOpenFlow,
  runOpenManualPauseSilentModeAfterCreate as runSilentModeFromManualOpenFlow,
  runPersistSilentReflectionStub as runPersistStubFromManualOpenFlow,
} from './manual-open/pause-reflect-generation-manual-open-flow';
import { dismissOpenPauseHome } from './manual-open/dismiss-open-pause-home';
import { openManualPauseFromHome } from './manual-open/open-manual-pause-from-home';
import { runOpenManualPauseSilentModeAfterCreate } from './manual-open/run-open-manual-pause-silent-mode-after-create';
import { runPersistSilentReflectionStub } from './manual-open/run-persist-silent-reflection-stub';
import { runReflectGeneration as runReflectGenerationDirect } from './holzen-reflect/run-reflect-generation';

import {
  buildManualPauseCreateOrReuseParams as buildCreateOrReuseFromFlow,
  buildManualPauseMarketContext as buildMarketContextFromFlow,
  buildManualPauseOpenParams as buildOpenParamsFromFlow,
  dismissOpenPauseHome as dismissFromFlow,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE as volatilityTemplateFromFlow,
  messageFromReflectGenerationResult as messageFromResultFromFlow,
  openManualPauseFromHome as openManualFromFlow,
  reflectGenerationPrerequisite as prerequisiteFromFlow,
  reflectGenerationUserErrorMessage as userErrorFromFlow,
  resolveEffectiveReflectionCopy as resolveCopyFromFlow,
  resolveReflectGenerationPrefetch as resolvePrefetchFromFlow,
  runOpenManualPauseSilentModeAfterCreate as runSilentModeFromFlow,
  runPersistSilentReflectionStub as runPersistStubFromFlow,
  runReflectGeneration,
  shouldClearReflectGenerationLoading as shouldClearLoadingFromFlow,
  shouldCommitReflectGeneration as shouldCommitFromFlow,
} from './pause-reflect-generation-flow';

describe('pause-reflect-generation-flow', () => {
  it('re-exports holzen-reflect domain helpers, run-reflect-generation, and manual-open leaf use cases', () => {
    expect(typeof resolvePrefetchFromFlow).toBe('function');
    expect(typeof shouldClearLoadingFromFlow).toBe('function');
    expect(typeof shouldCommitFromFlow).toBe('function');
    expect(typeof messageFromResultFromFlow).toBe('function');
    expect(typeof prerequisiteFromFlow).toBe('function');
    expect(typeof userErrorFromFlow).toBe('function');
    expect(typeof resolveCopyFromFlow).toBe('function');
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof buildCreateOrReuseFromFlow).toBe('function');
    expect(typeof buildOpenParamsFromFlow).toBe('function');
    expect(typeof buildMarketContextFromFlow).toBe('function');
    expect(typeof openManualFromFlow).toBe('function');
    expect(typeof dismissFromFlow).toBe('function');
    expect(typeof runSilentModeFromFlow).toBe('function');
    expect(typeof runPersistStubFromFlow).toBe('function');

    expect(resolvePrefetchFromFlow).toBe(resolveReflectGenerationPrefetch);
    expect(shouldClearLoadingFromFlow).toBe(shouldClearReflectGenerationLoading);
    expect(shouldCommitFromFlow).toBe(shouldCommitReflectGeneration);
    expect(messageFromResultFromFlow).toBe(messageFromReflectGenerationResult);
    expect(prerequisiteFromFlow).toBe(reflectGenerationPrerequisite);
    expect(userErrorFromFlow).toBe(reflectGenerationUserErrorMessage);
    expect(resolveCopyFromFlow).toBe(resolveEffectiveReflectionCopy);
    expect(runReflectGeneration).toBe(runReflectGenerationDirect);
    expect(buildCreateOrReuseFromFlow).toBe(buildManualPauseCreateOrReuseParams);
    expect(buildOpenParamsFromFlow).toBe(buildOpenParamsDirect);
    expect(buildMarketContextFromFlow).toBe(buildMarketContextDirect);
    expect(volatilityTemplateFromFlow).toBe(MANUAL_PAUSE_VOLATILITY_TEMPLATE);
    expect(openManualFromFlow).toBe(openManualPauseFromHome);
    expect(dismissFromFlow).toBe(dismissOpenPauseHome);
    expect(runSilentModeFromFlow).toBe(runOpenManualPauseSilentModeAfterCreate);
    expect(runPersistStubFromFlow).toBe(runPersistSilentReflectionStub);
  });

  it('umbrella bindings match generation subcluster CI anchors (leaf parity)', () => {
    expect(resolvePrefetchFromFlow).toBe(resolvePrefetchFromHookFlow);
    expect(shouldClearLoadingFromFlow).toBe(shouldClearLoadingFromHookFlow);
    expect(shouldCommitFromFlow).toBe(shouldCommitFromHookFlow);
    expect(messageFromResultFromFlow).toBe(messageFromResultFromHookFlow);
    expect(prerequisiteFromFlow).toBe(prerequisiteFromHookFlow);
    expect(userErrorFromFlow).toBe(userErrorFromHookFlow);
    expect(resolveCopyFromFlow).toBe(resolveCopyFromHookFlow);
    expect(runReflectGeneration).toBe(runReflectGenerationFromHookFlow);

    expect(buildCreateOrReuseFromFlow).toBe(buildCreateOrReuseFromManualOpenFlow);
    expect(buildOpenParamsFromFlow).toBe(buildOpenParamsFromManualOpenFlow);
    expect(buildMarketContextFromFlow).toBe(buildMarketContextFromManualOpenFlow);
    expect(volatilityTemplateFromFlow).toBe(volatilityTemplateFromManualOpenFlow);
    expect(openManualFromFlow).toBe(openManualFromManualOpenFlow);
    expect(dismissFromFlow).toBe(dismissFromManualOpenFlow);
    expect(runSilentModeFromFlow).toBe(runSilentModeFromManualOpenFlow);
    expect(runPersistStubFromFlow).toBe(runPersistStubFromManualOpenFlow);
  });
});
