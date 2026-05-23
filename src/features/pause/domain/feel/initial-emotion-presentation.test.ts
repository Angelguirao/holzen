import { describe, expect, it } from 'vitest';
import {
  buildInitialEmotionSelectUi,
  buildInitialEmotionSkipUi,
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
} from './initial-emotion-presentation';

describe('initial-emotion-presentation', () => {
  it('builds optimistic select UI with brief face', () => {
    expect(buildInitialEmotionSelectUi('fomo', 3, { briefFace: 'anxious' })).toEqual({
      moodDone: true,
      selectedMood: 'fomo',
      feelIntensity: 3,
      selectedBriefFace: 'anxious',
    });
  });

  it('rolls back select UI on sync failure', () => {
    expect(initialEmotionSelectRollbackUi()).toEqual({
      moodDone: false,
      selectedMood: null,
      feelIntensity: null,
      selectedBriefFace: null,
    });
  });

  it('builds skip UI and reset', () => {
    expect(buildInitialEmotionSkipUi()).toEqual({ moodDone: true, feelIntensity: null });
    expect(initialEmotionResetUi()).toEqual(initialEmotionSelectRollbackUi());
  });
});
