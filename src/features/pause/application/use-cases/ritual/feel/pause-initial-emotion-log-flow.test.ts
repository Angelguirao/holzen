import { describe, expect, it } from 'vitest';

import {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from './pause-initial-emotion-log-flow';
import {
  runInitialEmotionSelect as runSelectDirect,
  runInitialEmotionSkip as runSkipDirect,
} from './run-initial-emotion-log';

describe('pause-initial-emotion-log-flow', () => {
  it('re-exports initial emotion RPC from run-initial-emotion-log', () => {
    expect(typeof runInitialEmotionSelect).toBe('function');
    expect(typeof runInitialEmotionSkip).toBe('function');

    expect(runInitialEmotionSelect).toBe(runSelectDirect);
    expect(runInitialEmotionSkip).toBe(runSkipDirect);
  });
});
