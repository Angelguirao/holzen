import type { PracticeXpStepEventRow } from './compute-practice-xp-breakdown';
import { PRACTICE_XP_POST_PAUSE_CHECK_IN_BONUS } from './practice-xp-constants';

function readMood(payload: Record<string, unknown> | null | undefined): string | null {
  const mood = typeof payload?.mood === 'string' ? payload.mood.trim().toLowerCase() : '';
  return mood || null;
}

function readIntensity(payload: Record<string, unknown> | null | undefined): number | null {
  const raw = payload?.intensity;
  if (typeof raw === 'number' && raw >= 1 && raw <= 5) return raw;
  if (typeof raw === 'string' && raw !== '') {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 1 && n <= 5) return n;
  }
  return null;
}

/** Brief Done optional check-in — parity with `pause_brief_post_pause_check_in_xp`. */
export function briefPostPauseCheckInXpFromEvents(events: readonly PracticeXpStepEventRow[]): number {
  let initialMood: string | null = null;
  let initialIntensity: number | null = null;
  let postMood: string | null = null;
  let postIntensity: number | null = null;

  for (const e of events) {
    if (e.step_type === 'initial_emotion_logged') {
      initialMood = readMood(e.payload);
      initialIntensity = readIntensity(e.payload);
    }
    if (e.step_type === 'post_pause_emotion_logged') {
      postMood = readMood(e.payload);
      postIntensity = readIntensity(e.payload);
    }
  }

  if (!postMood) return 0;
  if (postMood !== initialMood || postIntensity !== initialIntensity) {
    return PRACTICE_XP_POST_PAUSE_CHECK_IN_BONUS;
  }
  return 0;
}
