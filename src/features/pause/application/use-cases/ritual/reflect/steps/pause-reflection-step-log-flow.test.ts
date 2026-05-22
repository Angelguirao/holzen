import { describe, expect, it } from 'vitest';

import {
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
} from './pause-reflection-step-log-flow';

describe('pause-reflection-step-log-flow', () => {
  it('re-exports reflection_step log use case and domain dedupe gate', () => {
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
  });
});
