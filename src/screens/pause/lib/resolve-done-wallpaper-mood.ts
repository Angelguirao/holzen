import { isPauseMoodValue, type MoodValue } from '@/features/pause/public';

export type DoneWallpaperMoodInput = {
  mood?: string | null;
  moodAfter?: string | null;
} | null | undefined;

/** Prefer post-pause mood for share wallpaper when valid. */
export function resolveDoneWallpaperMood(pauseData: DoneWallpaperMoodInput): MoodValue | null {
  if (pauseData?.moodAfter && isPauseMoodValue(pauseData.moodAfter)) return pauseData.moodAfter;
  if (pauseData?.mood && isPauseMoodValue(pauseData.mood)) return pauseData.mood;
  return null;
}
