import { isPauseMoodValue, type MoodValue } from '@/features/pause/domain/mood-value';

const MOOD_ACCENT_RGB: Record<MoodValue, string> = {
  fomo: 'rgb(168 92 72)',
  excited: 'rgb(176 108 64)',
  greedy: 'rgb(158 88 56)',
  anxious: 'rgb(148 118 88)',
  calm: 'rgb(96 132 112)',
  detached: 'rgb(120 128 136)',
  uncertain: 'rgb(132 120 104)',
  fearful: 'rgb(112 96 128)',
};

/** Top accent bar color for reflection share / Done wallpaper PNG. */
export function reflectionShareCanvasAccentRgb(mood?: string | null): string {
  if (mood && isPauseMoodValue(mood)) return MOOD_ACCENT_RGB[mood];
  return 'rgb(42 42 42)';
}
