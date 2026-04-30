/**
 * Demo fixture for Stats / Journey charts.
 *
 * Activated by `?demo=1` (or `localStorage.holzen_demo = '1'`) so the
 * Journey screens can render with realistic-looking data when the
 * signed-in account has very few real pauses. No DB writes — the
 * fixture is injected at the `usePauseStatsData` hook layer only.
 */

import type { PauseFullRow } from '@/hooks/use-pause-stats-data';
import type {
  PauseStepEventRow,
  PauseCompanionEventRow,
} from '@/lib/pause-state';

// Must match the moods/outcomes the Stats cards know about.
// Composure map (regulation/mood-shift): calm/detached/uncertain/excited/anxious/fearful/greedy/fomo
const MOODS_INITIAL = ['anxious', 'fearful', 'fomo', 'greedy', 'excited', 'uncertain'];
const MOODS_SHIFT = ['calm', 'detached', 'uncertain', 'calm', 'detached', 'calm'];
// Hold-rate metrics expect 'held' / 'nothing' / 'bought' / 'sold'.
const OUTCOMES = ['held', 'held', 'held', 'nothing', 'held', 'bought', 'sold'];
const SEVERITIES = ['mild', 'mild', 'moderate', 'moderate', 'high'] as const;
const COMPANIONS = ['signal', 'grounding', 'zoom_out', 'history', 'haiku'];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export interface DemoFixture {
  rows: PauseFullRow[];
  stepEvents: PauseStepEventRow[];
  companionEvents: PauseCompanionEventRow[];
}

export function buildDemoFixture(userId: string): DemoFixture {
  const rand = seeded(42);
  const rows: PauseFullRow[] = [];
  const stepEvents: PauseStepEventRow[] = [];
  const companionEvents: PauseCompanionEventRow[] = [];
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // 45 pauses spread over the last 75 days, ~85% completed.
  for (let i = 0; i < 45; i++) {
    const daysAgo = Math.floor(i * 1.6 + rand() * 1.5);
    const created = new Date(now - daysAgo * DAY - Math.floor(rand() * 8 * 3600 * 1000));
    const completed = new Date(created.getTime() + (60 + Math.floor(rand() * 240)) * 1000);
    const isCompleted = rand() > 0.15;
    const id = `demo-${i}-${created.getTime()}`;
    const initialMood = MOODS_INITIAL[Math.floor(rand() * MOODS_INITIAL.length)];
    const shiftMood = MOODS_SHIFT[Math.floor(rand() * MOODS_SHIFT.length)];
    const outcome = OUTCOMES[Math.floor(rand() * OUTCOMES.length)];
    // ~35% of completed pauses use no companions so the "without" bucket
    // in PerspectiveToolsImpactCard has ≥5 samples.
    const noCompanions = rand() < 0.35;
    const companionCount = noCompanions ? 0 : 1 + Math.floor(rand() * 3);
    const usedCompanions = COMPANIONS
      .slice()
      .sort(() => rand() - 0.5)
      .slice(0, companionCount);
    const severity = SEVERITIES[Math.floor(rand() * SEVERITIES.length)];
    const change24h = (rand() - 0.45) * (severity === 'high' ? 14 : severity === 'moderate' ? 7 : 3);

    rows.push({
      id,
      user_id: userId,
      state: isCompleted ? 'completed' : (rand() > 0.5 ? 'expired' : 'dismissed'),
      source: 'demo',
      context_snapshot: {
        btc_change_percent: change24h,
        change_24h_pct: change24h,
        btc_direction: change24h >= 0 ? 'up' : 'down',
        severity,
      },
      context_fingerprint: `demo-fp-${i}`,
      window_starts_at: created.toISOString(),
      window_ends_at: new Date(created.getTime() + 30 * 60 * 1000).toISOString(),
      created_at: created.toISOString(),
      engaged_at: isCompleted ? created.toISOString() : null,
      completed_at: isCompleted ? completed.toISOString() : null,
      terminal_at: isCompleted ? completed.toISOString() : new Date(created.getTime() + 30 * 60 * 1000).toISOString(),
      expired_reason: isCompleted ? null : 'window_elapsed',
      has_breath_completed: isCompleted,
      has_initial_emotion_logged: isCompleted,
      has_shift_emotion_logged: isCompleted && rand() > 0.1,
      has_outcome_logged: isCompleted,
      initial_mood: isCompleted ? initialMood : null,
      shift_mood: isCompleted ? shiftMood : null,
      outcome: isCompleted ? outcome : null,
      note_text: isCompleted && rand() > 0.4 ? 'Sample reflection note for demo mode.' : null,
      tags: isCompleted && rand() > 0.5 ? ['demo', rand() > 0.5 ? 'volatility' : 'patience'] : null,
      is_favorite: rand() > 0.85,
      counted_companion_count: isCompleted ? companionCount : 0,
      counted_companion_types: isCompleted && companionCount > 0 ? usedCompanions : null,
      reflection_text: isCompleted ? 'Markets move. You stayed with your breath.' : null,
      haiku_text: isCompleted && rand() > 0.7 ? 'Charts rise and fall slow / a single satoshi waits / breath returns to breath' : null,
    });

    if (isCompleted) {
      stepEvents.push({
        pause_instance_id: id,
        step_type: 'breath_completed',
        payload: {},
        created_at: created.toISOString(),
      } as unknown as PauseStepEventRow);
      stepEvents.push({
        pause_instance_id: id,
        step_type: 'initial_emotion_logged',
        payload: { mood: initialMood },
        created_at: created.toISOString(),
      } as unknown as PauseStepEventRow);
      stepEvents.push({
        pause_instance_id: id,
        step_type: 'shift_emotion_logged',
        payload: { mood: shiftMood },
        created_at: completed.toISOString(),
      } as unknown as PauseStepEventRow);
      stepEvents.push({
        pause_instance_id: id,
        step_type: 'outcome_logged',
        payload: { outcome },
        created_at: completed.toISOString(),
      } as unknown as PauseStepEventRow);

      for (const companion of usedCompanions) {
        companionEvents.push({
          pause_instance_id: id,
          companion_type: companion,
          action: 'complete',
          counts_for_pause: true,
          non_counting_reason: null,
          created_at: completed.toISOString(),
        } as unknown as PauseCompanionEventRow);
      }
    }
  }

  return { rows, stepEvents, companionEvents };
}

export function isDemoModeActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') {
      window.localStorage.setItem('holzen_demo', '1');
      return true;
    }
    if (params.get('demo') === '0') {
      window.localStorage.removeItem('holzen_demo');
      return false;
    }
    return window.localStorage.getItem('holzen_demo') === '1';
  } catch {
    return false;
  }
}

export const DEMO_MODE_STORAGE_KEY = 'holzen_demo';
export const DEMO_MODE_EVENT = 'holzen:demo-mode-changed';

export function setDemoMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(DEMO_MODE_EVENT, { detail: { enabled } }));
  } catch {
    /* ignore */
  }
}

