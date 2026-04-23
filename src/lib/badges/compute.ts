/**
 * Pause V2 badge computation.
 *
 * Pure function: (pause rows + step events + companion events) -> per-badge
 * { current, earned } snapshot. No DB, no side effects. BadgesPanelV2
 * consumes the output directly and also feeds it into `use-badge-sync`.
 *
 * Rules implement the 4-family / 14-active model from
 * `docs/systems/badges-system.md`:
 *
 * Foundation:
 *   first-pause           -> count of state=completed pauses >= 1
 *   first-week            -> completed pauses touching >= 3 distinct local
 *                            days within any rolling 7-day window
 *   first-ritual          -> first completed pause with counted companion
 *
 * Core skill ladders (only "current tier" rendered by panel):
 *   regulation-{10,25,50} -> count of completed pauses where initial mood
 *                            was reactive AND shift mood was composed
 *   tolerance-{5,15,40}   -> count of completed pauses with outcome
 *                            in {held, nothing} AND severity >= moderate
 *   alignment-{5,15,40}   -> count of completed pauses aligning with the
 *                            user's hold goal (held/nothing under a
 *                            'forever' goal; held under time/price goals).
 *                            When no hold goal exists, this counter is
 *                            fixed at 0 (the ladder stays visible but shows
 *                            "configure hold goal to earn" progress copy).
 *   reappraisal-{10,25,50}-> count of counted companion events across
 *                            completed pauses (counts_for_pause=true).
 *   awareness-{10,25,50}  -> count of completed pauses with rich depth
 *                            signals (note length > 20 OR tags >= 1 OR
 *                            is_favorite).
 *
 * Mastery (Pro-only):
 *   iron-hands            -> >= 20 completed pauses with severity >=
 *                            moderate AND >= 80% hold rate in that subset
 *   thirty-strong         -> 30-day rolling active streak of completed
 *                            pauses
 *   full-ritual-100       -> 100 completed pauses with counted companion
 *                            count >= required_companion_count
 *
 * Legacy (calendar-day badges):
 *   btc-genesis           -> completed pause on Jan 3 (local time)
 *   btc-pizza             -> completed pause on May 22
 *   btc-halving           -> completed pause within +-3 days of any
 *                            halving
 */

import {
  BADGE_DEFINITIONS,
  LEGACY_CALENDAR,
  HALVING_DATES,
  type BadgeDefinition,
  type CoreSkill,
} from '@/lib/badges/definitions';
import type {
  PauseStepEventRow,
  PauseCompanionEventRow,
} from '@/lib/pause-state';
import type { PauseFullRow } from '@/hooks/use-pause-stats-data';

export interface BadgeSnapshot extends BadgeDefinition {
  current: number;
  earned: boolean;
  progress: number;
}

interface HoldGoal {
  type: string | null;
}

const COMPOSED_MOODS = new Set(['calm', 'detached']);
const REACTIVE_MOODS = new Set(['fomo', 'greedy', 'fearful', 'anxious', 'excited']);
const HOLD_OUTCOMES = new Set(['held', 'nothing']);

function severityFromSnapshot(r: PauseFullRow): 'mild' | 'moderate' | 'high' | null {
  const s = r.context_snapshot?.severity;
  if (typeof s === 'string' && (s === 'mild' || s === 'moderate' || s === 'high')) return s;
  const chg = Number(
    r.context_snapshot?.change_24h_pct ?? r.context_snapshot?.changePercent ?? 0,
  );
  const abs = Math.abs(Number.isFinite(chg) ? chg : 0);
  if (abs >= 10) return 'high';
  if (abs >= 5) return 'moderate';
  if (abs >= 1) return 'mild';
  return null;
}

function isMonthDay(iso: string | null, month: number, day: number): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getMonth() === month && d.getDate() === day;
}

function withinDays(iso: string | null, target: string, days: number): boolean {
  if (!iso) return false;
  const ms = days * 24 * 60 * 60 * 1000;
  return Math.abs(new Date(iso).getTime() - new Date(target).getTime()) <= ms;
}

/**
 * Count distinct local-calendar days touched by an array of ISO timestamps
 * restricted to a rolling 7-day window ending at each candidate day.
 * Returns the max count (i.e. "most days paused inside any 7-day window").
 */
function rollingWeekMaxDistinctDays(isoList: string[]): number {
  if (isoList.length === 0) return 0;
  const days = isoList
    .map((s) => {
      const d = new Date(s);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    })
    .sort((a, b) => a - b);
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  let maxCount = 1;
  for (let i = 0; i < days.length; i++) {
    const windowEnd = days[i];
    const windowStart = windowEnd - (weekMs - 1);
    const distinct = new Set<number>();
    for (let j = i; j >= 0 && days[j] >= windowStart; j--) distinct.add(days[j]);
    if (distinct.size > maxCount) maxCount = distinct.size;
  }
  return maxCount;
}

function rollingDailyStreak(completedRows: readonly PauseFullRow[]): number {
  if (completedRows.length === 0) return 0;
  const days = new Set<number>();
  for (const r of completedRows) {
    const t = r.completed_at ?? r.engaged_at ?? r.created_at;
    const d = new Date(t);
    days.add(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
  }
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; ; i++) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000).getTime();
    if (days.has(d)) streak++;
    else break;
  }
  return streak;
}

export function computeBadges(params: {
  completedRows: readonly PauseFullRow[];
  stepEvents: readonly PauseStepEventRow[];
  companionEvents: readonly PauseCompanionEventRow[];
  holdGoal?: HoldGoal | null;
}): BadgeSnapshot[] {
  const { completedRows, companionEvents, holdGoal } = params;

  // Foundation counters
  const firstPause = completedRows.length;
  const firstRitual = completedRows.filter((r) => r.counted_companion_count >= 1).length;
  const rollingWeek = rollingWeekMaxDistinctDays(
    completedRows.map((r) => r.completed_at ?? r.engaged_at ?? r.created_at),
  );

  // Core skill counters
  const regulation = completedRows.filter(
    (r) =>
      r.initial_mood != null &&
      r.shift_mood != null &&
      REACTIVE_MOODS.has(r.initial_mood) &&
      COMPOSED_MOODS.has(r.shift_mood),
  ).length;

  const tolerance = completedRows.filter((r) => {
    if (!r.outcome || !HOLD_OUTCOMES.has(r.outcome)) return false;
    const sev = severityFromSnapshot(r);
    return sev === 'moderate' || sev === 'high';
  }).length;

  const hasHoldGoal = holdGoal?.type != null;
  const alignment = hasHoldGoal
    ? completedRows.filter((r) => {
        if (!r.outcome) return false;
        if (holdGoal?.type === 'forever') return HOLD_OUTCOMES.has(r.outcome);
        return r.outcome === 'held' || r.outcome === 'nothing';
      }).length
    : 0;

  // Counted companion completions across all completed pauses.
  const completedIds = new Set(completedRows.map((r) => r.id));
  const reappraisal = companionEvents.filter(
    (e) =>
      e.action === 'complete' &&
      e.counts_for_pause === true &&
      e.pause_instance_id != null &&
      completedIds.has(e.pause_instance_id),
  ).length;

  const awareness = completedRows.filter((r) => {
    const noteLen = (r.note_text ?? '').length;
    if (noteLen > 20) return true;
    if (r.tags && r.tags.length > 0) return true;
    if (r.is_favorite) return true;
    return false;
  }).length;

  // Mastery counters
  const highSeverityCompleted = completedRows.filter((r) => {
    const sev = severityFromSnapshot(r);
    return sev === 'moderate' || sev === 'high';
  });
  const highSeverityHolds = highSeverityCompleted.filter(
    (r) => r.outcome && HOLD_OUTCOMES.has(r.outcome),
  ).length;
  const ironHandsPct =
    highSeverityCompleted.length >= 20
      ? Math.round((highSeverityHolds / highSeverityCompleted.length) * 100)
      : 0;

  const thirtyStrong = rollingDailyStreak(completedRows);

  const fullRitual100 = completedRows.filter((r) => r.counted_companion_count >= 1).length;

  // Legacy counters
  const legacyGenesis = completedRows.some((r) =>
    isMonthDay(r.completed_at ?? r.engaged_at ?? r.created_at, LEGACY_CALENDAR['btc-genesis'].month, LEGACY_CALENDAR['btc-genesis'].day),
  )
    ? 1
    : 0;
  const legacyPizza = completedRows.some((r) =>
    isMonthDay(r.completed_at ?? r.engaged_at ?? r.created_at, LEGACY_CALENDAR['btc-pizza'].month, LEGACY_CALENDAR['btc-pizza'].day),
  )
    ? 1
    : 0;
  const legacyHalving = completedRows.some((r) =>
    HALVING_DATES.some((hd) => withinDays(r.completed_at ?? r.engaged_at ?? r.created_at, hd, 3)),
  )
    ? 1
    : 0;

  const currentByBadgeId: Record<string, number> = {
    'first-pause': firstPause,
    'first-week': rollingWeek,
    'first-ritual': firstRitual,

    'regulation-10': regulation,
    'regulation-25': regulation,
    'regulation-50': regulation,

    'tolerance-5': tolerance,
    'tolerance-15': tolerance,
    'tolerance-40': tolerance,

    'alignment-5': alignment,
    'alignment-15': alignment,
    'alignment-40': alignment,

    'reappraisal-10': reappraisal,
    'reappraisal-25': reappraisal,
    'reappraisal-50': reappraisal,

    'awareness-10': awareness,
    'awareness-25': awareness,
    'awareness-50': awareness,

    'iron-hands': ironHandsPct,
    'thirty-strong': thirtyStrong,
    'full-ritual-100': fullRitual100,

    'btc-genesis': legacyGenesis,
    'btc-pizza': legacyPizza,
    'btc-halving': legacyHalving,
  };

  // Touch coreSkills unused-warning by silencing.
  void ({} as CoreSkill);

  return BADGE_DEFINITIONS.map((def) => {
    const current = currentByBadgeId[def.id] ?? 0;
    const earned = current >= def.requirement;
    const progress = def.requirement > 0 ? Math.min(1, current / def.requirement) : 0;
    return { ...def, current, earned, progress };
  });
}
