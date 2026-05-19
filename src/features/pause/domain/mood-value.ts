/** Canonical Feel / Shift / post-pause mood keys (keep aligned with `moodCheck.moods.*`). */
const MOOD_GROUPS = [
  {
    key: 'highEnergy',
    moods: [
      { value: 'fomo', key: 'fomo' },
      { value: 'excited', key: 'excited' },
      { value: 'greedy', key: 'greedy' },
      { value: 'anxious', key: 'anxious' },
    ],
  },
  {
    key: 'lowEnergy',
    moods: [
      { value: 'calm', key: 'calm' },
      { value: 'detached', key: 'detached' },
      { value: 'uncertain', key: 'uncertain' },
      { value: 'fearful', key: 'fearful' },
    ],
  },
] as const;

const ALL_MOODS = [...MOOD_GROUPS[0].moods, ...MOOD_GROUPS[1].moods] as const;

export type MoodValue = (typeof ALL_MOODS)[number]['value'];

export const PAUSE_MOOD_VALUES: readonly MoodValue[] = ALL_MOODS.map((m) => m.value);

/** For `MoodCheck` presentation — mood groups with i18n keys. */
export const PAUSE_MOOD_GROUPS = MOOD_GROUPS;
