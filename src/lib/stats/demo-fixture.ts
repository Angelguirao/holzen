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

const COMPANIONS = ['signal', 'grounding', 'zoom_out', 'history', 'haiku'];
const REACTIVE = ['anxious', 'fearful', 'fomo', 'greedy', 'excited'] as const;
const COMPOSED = ['calm', 'detached'] as const;

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

interface PauseSpec {
  daysAgo: number;
  /** Optional explicit completed date (overrides daysAgo). */
  date?: Date;
  initial: string;
  shift: string;
  outcome: 'held' | 'nothing' | 'bought' | 'sold';
  severity: 'mild' | 'moderate' | 'high';
  companionCount: number;
  depth: boolean;
  state?: 'completed' | 'expired' | 'dismissed';
}

/**
 * Deterministic fixture seeded to unlock a representative spread of every
 * badge family + populate every Stats card. Targets the rules in
 * `src/lib/badges/compute.ts`:
 *
 *   Foundation: first-pause, first-week (3+ days in any rolling 7), first-ritual
 *   Core skills (mid-tier): regulation 25, tolerance 15, alignment 15,
 *     reappraisal 25, awareness 25
 *   Mastery: iron-hands (≥20 mod/high, ≥80% held), thirty-strong (30-day
 *     streak from today), full-ritual-100 needs 100 companion pauses
 *   Legacy: pause on Jan 3 (genesis), May 22 (pizza), within ±3d of a halving
 */
export function buildDemoFixture(userId: string): DemoFixture {
  const rand = seeded(42);
  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;
  const specs: PauseSpec[] = [];

  const pickReactive = () => REACTIVE[Math.floor(rand() * REACTIVE.length)];
  const pickComposed = () => COMPOSED[Math.floor(rand() * COMPOSED.length)];

  // ---- Mastery: 30-day rolling streak from today (also feeds first-week,
  // first-pause, awareness, reappraisal). One pause per day, alternating
  // signal patterns so other counters fill alongside the streak.
  for (let d = 0; d < 30; d++) {
    const reactive = d % 2 === 0;
    specs.push({
      daysAgo: d,
      initial: reactive ? pickReactive() : 'uncertain',
      shift: reactive ? pickComposed() : 'calm',
      outcome: d % 5 === 0 ? 'nothing' : 'held',
      severity: d % 3 === 0 ? 'high' : d % 3 === 1 ? 'moderate' : 'mild',
      companionCount: 1 + (d % 3),
      depth: d % 2 === 0,
    });
  }

  // ---- Iron-hands: guarantee ≥20 moderate/high pauses with ≥80% held.
  // The 30-day streak above already yields ~20 mod/high. Add 6 more held
  // mod/high to push the held ratio comfortably above 80%.
  for (let d = 0; d < 6; d++) {
    specs.push({
      daysAgo: 35 + d * 2,
      initial: pickReactive(),
      shift: pickComposed(),
      outcome: 'held',
      severity: d % 2 === 0 ? 'high' : 'moderate',
      companionCount: 1,
      depth: true,
    });
  }

  // ---- Reappraisal & awareness top-up — ensures regulation-25, awareness-25,
  // reappraisal-25 ladders all clear. (30-day streak already covers most.)
  for (let i = 0; i < 12; i++) {
    specs.push({
      daysAgo: 50 + i * 3,
      initial: pickReactive(),
      shift: pickComposed(),
      outcome: i % 4 === 0 ? 'bought' : 'held',
      severity: i % 2 === 0 ? 'moderate' : 'mild',
      companionCount: 1,
      depth: true,
    });
  }

  // ---- A few non-companion pauses so PerspectiveToolsImpactCard has ≥5
  // samples in the "without" bucket.
  for (let i = 0; i < 6; i++) {
    specs.push({
      daysAgo: 90 + i * 2,
      initial: pickReactive(),
      shift: i % 2 === 0 ? pickComposed() : 'uncertain',
      outcome: i % 3 === 0 ? 'sold' : 'held',
      severity: 'mild',
      companionCount: 0,
      depth: i % 2 === 0,
    });
  }

  // ---- A few expired/dismissed pauses for realism (don't count toward
  // any badge — `compute.ts` filters to completed only).
  for (let i = 0; i < 4; i++) {
    specs.push({
      daysAgo: 100 + i * 3,
      initial: pickReactive(),
      shift: 'uncertain',
      outcome: 'held',
      severity: 'mild',
      companionCount: 0,
      depth: false,
      state: i % 2 === 0 ? 'expired' : 'dismissed',
    });
  }

  // ---- Legacy anchors: most-recent past Jan 3 (Genesis), May 22 (Pizza),
  // and 2024-04-20 (last halving). Picked at noon UTC.
  const lastPastDate = (month: number, day: number) => {
    const candidate = new Date(now.getFullYear(), month, day, 12, 0, 0);
    if (candidate.getTime() > now.getTime() - DAY) {
      candidate.setFullYear(now.getFullYear() - 1);
    }
    return candidate;
  };
  specs.push({
    daysAgo: 0,
    date: lastPastDate(0, 3),
    initial: 'anxious',
    shift: 'calm',
    outcome: 'held',
    severity: 'moderate',
    companionCount: 1,
    depth: true,
  });
  specs.push({
    daysAgo: 0,
    date: lastPastDate(4, 22),
    initial: 'fomo',
    shift: 'detached',
    outcome: 'held',
    severity: 'mild',
    companionCount: 1,
    depth: true,
  });
  specs.push({
    daysAgo: 0,
    date: new Date('2024-04-20T12:00:00Z'),
    initial: 'excited',
    shift: 'calm',
    outcome: 'held',
    severity: 'high',
    companionCount: 2,
    depth: true,
  });

  // ---- Build rows + events
  const rows: PauseFullRow[] = [];
  const stepEvents: PauseStepEventRow[] = [];
  const companionEvents: PauseCompanionEventRow[] = [];

  specs.forEach((spec, i) => {
    const completedAt =
      spec.date ?? new Date(now.getTime() - spec.daysAgo * DAY - 8 * 3600 * 1000);
    const createdAt = new Date(completedAt.getTime() - 4 * 60 * 1000);
    const id = `demo-${i}-${completedAt.getTime()}`;
    const state: 'completed' | 'expired' | 'dismissed' = spec.state ?? 'completed';
    const isCompleted = state === 'completed';

    const change24h =
      (spec.severity === 'high' ? 11 : spec.severity === 'moderate' ? 6 : 2) *
      (rand() > 0.5 ? 1 : -1);

    const usedCompanions = COMPANIONS.slice(0, spec.companionCount);

    rows.push({
      id,
      user_id: userId,
      state,
      source: 'demo',
      context_snapshot: {
        btc_change_percent: change24h,
        change_24h_pct: change24h,
        btc_direction: change24h >= 0 ? 'up' : 'down',
        severity: spec.severity,
      },
      context_fingerprint: `demo-fp-${i}`,
      window_starts_at: createdAt.toISOString(),
      window_ends_at: new Date(createdAt.getTime() + 30 * 60 * 1000).toISOString(),
      created_at: createdAt.toISOString(),
      engaged_at: isCompleted ? createdAt.toISOString() : null,
      completed_at: isCompleted ? completedAt.toISOString() : null,
      terminal_at: isCompleted
        ? completedAt.toISOString()
        : new Date(createdAt.getTime() + 30 * 60 * 1000).toISOString(),
      expired_reason: isCompleted ? null : 'window_elapsed',
      has_breath_completed: isCompleted,
      has_initial_emotion_logged: isCompleted,
      has_shift_emotion_logged: isCompleted,
      has_outcome_logged: isCompleted,
      initial_mood: isCompleted ? spec.initial : null,
      shift_mood: isCompleted ? spec.shift : null,
      outcome: isCompleted ? spec.outcome : null,
      note_text:
        isCompleted && spec.depth
          ? 'Stayed with the breath. Watched the urge arrive and pass without action.'
          : null,
      tags: isCompleted && spec.depth ? ['demo', 'patience'] : null,
      is_favorite: isCompleted && spec.depth && i % 7 === 0,
      counted_companion_count: isCompleted ? spec.companionCount : 0,
      counted_companion_types:
        isCompleted && spec.companionCount > 0 ? usedCompanions : null,
      reflection_text: isCompleted
        ? 'Markets move. You stayed with your breath.'
        : null,
      haiku_text:
        isCompleted && i % 5 === 0
          ? 'Charts rise and fall slow / a single satoshi waits / breath returns to breath'
          : null,
    });

    if (!isCompleted) return;

    stepEvents.push(
      {
        pause_instance_id: id,
        step_type: 'breath_completed',
        payload: {},
        created_at: createdAt.toISOString(),
      } as unknown as PauseStepEventRow,
      {
        pause_instance_id: id,
        step_type: 'initial_emotion_logged',
        payload: { mood: spec.initial },
        created_at: createdAt.toISOString(),
      } as unknown as PauseStepEventRow,
      {
        pause_instance_id: id,
        step_type: 'shift_emotion_logged',
        payload: { mood: spec.shift },
        created_at: completedAt.toISOString(),
      } as unknown as PauseStepEventRow,
      {
        pause_instance_id: id,
        step_type: 'outcome_logged',
        payload: { outcome: spec.outcome },
        created_at: completedAt.toISOString(),
      } as unknown as PauseStepEventRow,
    );

    for (const companion of usedCompanions) {
      companionEvents.push({
        pause_instance_id: id,
        companion_type: companion,
        action: 'complete',
        counts_for_pause: true,
        non_counting_reason: null,
        created_at: completedAt.toISOString(),
      } as unknown as PauseCompanionEventRow);
    }
  });

  // Newest first to match the real query ordering.
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

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

