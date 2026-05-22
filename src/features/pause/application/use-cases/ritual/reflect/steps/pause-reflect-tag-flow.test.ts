import { describe, expect, it } from 'vitest';

import { runPauseReflectTagUpdate as runTagDirect } from './run-pause-reflect-tag-update';
import { runPauseReflectTagUpdate } from './pause-reflect-tag-flow';

describe('pause-reflect-tag-flow', () => {
  it('re-exports tag update use case from leaf module', () => {
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(runPauseReflectTagUpdate).toBe(runTagDirect);
  });
});
