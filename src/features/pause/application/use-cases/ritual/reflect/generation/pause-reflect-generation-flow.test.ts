import { describe, expect, it } from 'vitest';

import {
  openManualPauseFromHome,
  reflectGenerationPrerequisite,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
} from './pause-reflect-generation-flow';

describe('pause-reflect-generation-flow', () => {
  it('re-exports holzen-reflect helpers, run-reflect-generation, and manual-open leaf use cases', () => {
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
  });
});
