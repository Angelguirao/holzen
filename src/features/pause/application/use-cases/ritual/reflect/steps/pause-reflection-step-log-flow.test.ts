import { describe, expect, it } from 'vitest';

import { shouldLogPauseReflectionStep } from '@/features/pause/domain/reflect/steps/reflection-step-log';

import {
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep as shouldLogFromFlow,
} from './pause-reflection-step-log-flow';
import { runPauseReflectionStepLogOnce as runReflectionStepDirect } from './run-pause-reflection-step-log';

describe('pause-reflection-step-log-flow', () => {
  it('re-exports reflection_step log use case and domain dedupe gate', () => {
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldLogFromFlow).toBe('function');

    expect(runPauseReflectionStepLogOnce).toBe(runReflectionStepDirect);
    expect(shouldLogFromFlow).toBe(shouldLogPauseReflectionStep);
  });
});
