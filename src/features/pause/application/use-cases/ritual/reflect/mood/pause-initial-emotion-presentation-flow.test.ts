import { describe, expect, it } from 'vitest';

import {
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
} from '@/features/pause/domain/reflect/mood/initial-emotion-presentation';

import {
  initialEmotionResetUi as resetUiFromFlow,
  initialEmotionSelectRollbackUi as rollbackUiFromFlow,
} from './pause-initial-emotion-presentation-flow';

describe('pause-initial-emotion-presentation-flow', () => {
  it('re-exports Feel-step presentation helpers from domain', () => {
    expect(typeof resetUiFromFlow).toBe('function');
    expect(typeof rollbackUiFromFlow).toBe('function');

    expect(resetUiFromFlow).toBe(initialEmotionResetUi);
    expect(rollbackUiFromFlow).toBe(initialEmotionSelectRollbackUi);
  });
});
