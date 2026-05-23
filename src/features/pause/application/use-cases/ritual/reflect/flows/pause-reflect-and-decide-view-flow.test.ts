import { describe, expect, it } from 'vitest';

import {
  resolvePauseSessionReflectAndDecideAfterGeneration as resolveAfterGenDirect,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightDirect,
} from '@/features/pause/domain/reflect/flows/pause-session-reflect-and-decide-flow';

import {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
} from './pause-reflect-and-decide-view-flow';

describe('pause-reflect-and-decide-view-flow', () => {
  it('re-exports reflect+decide preflight and post-generation view helpers from domain', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');

    expect(resolvePauseSessionReflectAndDecidePreflight).toBe(resolvePreflightDirect);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).toBe(resolveAfterGenDirect);
  });
});
