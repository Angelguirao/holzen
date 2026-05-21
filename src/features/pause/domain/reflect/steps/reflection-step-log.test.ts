import { describe, expect, it } from 'vitest';
import {
  buildReflectReflectionStepPayload,
  shouldLogPauseReflectionStep,
} from './reflection-step-log';

describe('buildReflectReflectionStepPayload', () => {
  it('uses pause_reflect surface', () => {
    expect(buildReflectReflectionStepPayload()).toEqual({ surface: 'pause_reflect' });
  });
});

describe('shouldLogPauseReflectionStep', () => {
  it('requires instance id and settled reflection state', () => {
    expect(
      shouldLogPauseReflectionStep({
        pauseInstanceId: null,
        reflectionLoading: false,
        reflectionMessage: 'hi',
        reflectionError: null,
      }),
    ).toBe(false);
    expect(
      shouldLogPauseReflectionStep({
        pauseInstanceId: 'i',
        reflectionLoading: true,
        reflectionMessage: 'hi',
        reflectionError: null,
      }),
    ).toBe(false);
    expect(
      shouldLogPauseReflectionStep({
        pauseInstanceId: 'i',
        reflectionLoading: false,
        reflectionMessage: '',
        reflectionError: null,
      }),
    ).toBe(false);
    expect(
      shouldLogPauseReflectionStep({
        pauseInstanceId: 'i',
        reflectionLoading: false,
        reflectionMessage: '',
        reflectionError: 'err',
      }),
    ).toBe(true);
  });
});
