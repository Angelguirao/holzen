import { describe, expect, it } from 'vitest';

import {
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
} from './pause-initial-emotion-presentation-flow';

describe('pause-initial-emotion-presentation-flow', () => {
  it('re-exports Feel-step presentation helpers from domain', () => {
    expect(typeof initialEmotionResetUi).toBe('function');
    expect(typeof initialEmotionSelectRollbackUi).toBe('function');
  });
});
