import { describe, expect, it } from 'vitest';

import {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
} from './pause-reflect-and-decide-view-flow';

describe('pause-reflect-and-decide-view-flow', () => {
  it('re-exports reflect+decide preflight and post-generation view helpers from domain', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
  });
});
