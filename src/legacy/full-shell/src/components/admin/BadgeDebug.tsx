import { useMemo } from 'react';
import { Check, X, Lock } from 'lucide-react';
import { useAuth } from '@/features/auth/public';
import { usePauseStatsData } from '@/legacy/full-shell/src/hooks/use-pause-stats-data';
import { useHoldGoalProfile } from '@/features/user/public-hooks';
import { useBadges } from '@/legacy/full-shell/src/hooks/use-badges';
import {
  BADGE_DEFINITIONS,
  CORE_SKILL_KEYS,
  LEGACY_CALENDAR,
  HALVING_DATES,
  type BadgeFamily,
} from '@/legacy/full-shell/src/lib/badges/definitions';
import { cn } from '@/lib/utils';

/**
 * Admin-only Badge Eligibility Debug view.
 *
 * For the currently signed-in admin, this shows — per badge — exactly
 * which checks the eligibility logic in `src/lib/badges/compute.ts`
 * passed or failed, with the measured values used in the comparison.
 *
 * It does NOT re-implement compute.ts; it consumes the same
 * `useBadges()` snapshot the panel uses, then annotates each row with
 * the underlying signals (severity buckets, mood transitions, hold-goal
 * state, calendar-day matches, etc.) so an admin can see *why* a badge
 * is or is not unlocked.
 */
export function BadgeDebug() {
  const { user } = useAuth();
  const { ready, rows, stepEvents, companionEvents } = usePauseStatsData();
  const { data: holdGoal } = useHoldGoalProfile();
  const { snapshots } = useBadges({
    rows,
    stepEvents,
    companionEvents,
    holdGoal: holdGoal ?? null,
    trackedAssetId: holdGoal?.trackedAssetId,
  });

  const completed = useMemo(() => rows.filter((r) => r.state === 'completed'), [rows]);

  // Aggregate signals once per render so each row reads from the same
  // source-of-truth as compute.ts.
  const signals = useMemo(() => {
    const COMPOSED = new Set(['calm', 'detached']);
    const REACTIVE = new Set(['fomo', 'greedy', 'fearful', 'anxious', 'excited']);
    // Mirrors src/lib/badges/compute.ts — legacy `nothing` rows are no longer
    // hold-aligned for badge counters.
    const HOLD = new Set(['held']);

    const sevOf = (
      r: (typeof completed)[number],
    ): 'mild' | 'moderate' | 'high' | null => {
      const s = (r.context_snapshot as Record<string, unknown> | null)?.severity;
      if (s === 'mild' || s === 'moderate' || s === 'high') return s;
      const chg = Number(
        (r.context_snapshot as Record<string, unknown> | null)?.change_24h_pct ??
          (r.context_snapshot as Record<string, unknown> | null)?.changePercent ??
          0,
      );
      const abs = Math.abs(Number.isFinite(chg) ? chg : 0);
      if (abs >= 10) return 'high';
      if (abs >= 5) return 'moderate';
      if (abs >= 1) return 'mild';
      return null;
    };

    let regulationN = 0;
    let toleranceN = 0;
    let alignmentN = 0;
    let awarenessN = 0;
    let firstRitualN = 0;
    let modHighTotal = 0;
    let modHighHolds = 0;
    let genesisHits = 0;
    let pizzaHits = 0;
    let halvingHits = 0;
    const dayBuckets = new Set<string>();

    for (const r of completed) {
      const ts = r.completed_at ?? r.engaged_at ?? r.created_at;
      const d = new Date(ts);
      dayBuckets.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      if (
        r.initial_mood &&
        r.shift_mood &&
        REACTIVE.has(r.initial_mood) &&
        COMPOSED.has(r.shift_mood)
      ) {
        regulationN++;
      }
      const sev = sevOf(r);
      if (sev === 'moderate' || sev === 'high') {
        modHighTotal++;
        if (r.outcome && HOLD.has(r.outcome)) {
          toleranceN++;
          modHighHolds++;
        }
      }
      if (holdGoal?.type) {
        if (r.outcome && HOLD.has(r.outcome)) {
          alignmentN++;
        }
      }
      const noteLen = (r.note_text ?? '').length;
      if (noteLen > 20 || (r.tags && r.tags.length > 0) || r.is_favorite) awarenessN++;
      if (r.counted_companion_count >= 1) firstRitualN++;

      if (
        d.getMonth() === LEGACY_CALENDAR['btc-genesis'].month &&
        d.getDate() === LEGACY_CALENDAR['btc-genesis'].day
      ) {
        genesisHits++;
      }
      if (
        d.getMonth() === LEGACY_CALENDAR['btc-pizza'].month &&
        d.getDate() === LEGACY_CALENDAR['btc-pizza'].day
      ) {
        pizzaHits++;
      }
      for (const hd of HALVING_DATES) {
        if (Math.abs(d.getTime() - new Date(hd).getTime()) <= 3 * 86400000) {
          halvingHits++;
          break;
        }
      }
    }

    const reappraisalN = companionEvents.filter(
      (e) =>
        e.action === 'complete' &&
        e.counts_for_pause === true &&
        e.pause_instance_id != null &&
        completed.some((r) => r.id === e.pause_instance_id),
    ).length;

    return {
      regulationN,
      toleranceN,
      alignmentN,
      awarenessN,
      reappraisalN,
      firstRitualN,
      modHighTotal,
      modHighHolds,
      ironHandsPct:
        modHighTotal >= 20 ? Math.round((modHighHolds / modHighTotal) * 100) : 0,
      genesisHits,
      pizzaHits,
      halvingHits,
      uniqueDays: dayBuckets.size,
    };
  }, [completed, companionEvents, holdGoal]);

  const checksFor = (badgeId: string): { label: string; pass: boolean; detail: string }[] => {
    switch (badgeId) {
      case 'first-pause':
        return [
          {
            label: '≥1 completed pause',
            pass: completed.length >= 1,
            detail: `${completed.length} completed`,
          },
        ];
      case 'first-week':
        return [
          {
            label: '≥3 distinct local days within any rolling 7-day window',
            pass: getRollingWeek(completed) >= 3,
            detail: `peak window = ${getRollingWeek(completed)} day(s) · total unique days = ${signals.uniqueDays}`,
          },
        ];
      case 'first-ritual':
        return [
          {
            label: '≥1 completed pause with counted_companion_count ≥ 1',
            pass: signals.firstRitualN >= 1,
            detail: `${signals.firstRitualN} ritual pause(s)`,
          },
        ];
      case 'iron-hands':
        return [
          {
            label: '≥20 completed pauses at moderate/high severity',
            pass: signals.modHighTotal >= 20,
            detail: `${signals.modHighTotal} mod/high pauses`,
          },
          {
            label: '≥80% hold rate inside that subset',
            pass: signals.modHighTotal >= 20 && signals.ironHandsPct >= 80,
            detail:
              signals.modHighTotal >= 20
                ? `${signals.modHighHolds}/${signals.modHighTotal} held (${signals.ironHandsPct}%)`
                : 'gated by sample-size check above',
          },
        ];
      case 'thirty-strong':
        return [
          {
            label: '30 consecutive days ending today with ≥1 completed pause',
            pass: getStreak(completed) >= 30,
            detail: `current streak = ${getStreak(completed)} day(s)`,
          },
        ];
      case 'full-ritual-100':
        return [
          {
            label: '100 completed pauses with a counted companion',
            pass: signals.firstRitualN >= 100,
            detail: `${signals.firstRitualN}/100 ritual pauses`,
          },
        ];
      case 'btc-genesis':
        return [
          {
            label: 'Completed pause on Jan 3 (local time)',
            pass: signals.genesisHits >= 1,
            detail: `${signals.genesisHits} matching pause(s)`,
          },
        ];
      case 'btc-pizza':
        return [
          {
            label: 'Completed pause on May 22 (local time)',
            pass: signals.pizzaHits >= 1,
            detail: `${signals.pizzaHits} matching pause(s)`,
          },
        ];
      case 'btc-halving':
        return [
          {
            label: 'Completed pause within ±3 days of any halving',
            pass: signals.halvingHits >= 1,
            detail: `${signals.halvingHits} matching pause(s) · halvings: ${HALVING_DATES.join(', ')}`,
          },
        ];
      default:
        // Core skill ladder — same counter for all 3 tiers, just different requirement.
        if (badgeId.startsWith('regulation-')) {
          const need = parseInt(badgeId.split('-')[1] ?? '0', 10);
          return [
            {
              label: 'Reactive → composed mood transitions across completed pauses',
              pass: signals.regulationN >= need,
              detail: `${signals.regulationN}/${need} transitions`,
            },
          ];
        }
        if (badgeId.startsWith('tolerance-')) {
          const need = parseInt(badgeId.split('-')[1] ?? '0', 10);
          return [
            {
              label: 'Held/Nothing outcomes during moderate or high severity',
              pass: signals.toleranceN >= need,
              detail: `${signals.toleranceN}/${need} qualifying pauses · pool ${signals.modHighTotal} mod/high`,
            },
          ];
        }
        if (badgeId.startsWith('alignment-')) {
          const need = parseInt(badgeId.split('-')[1] ?? '0', 10);
          return [
            {
              label: 'Hold goal configured in profile',
              pass: !!holdGoal?.type,
              detail: holdGoal?.type ? `goal type = ${holdGoal.type}` : 'no hold goal — counter forced to 0',
            },
            {
              label: 'Outcomes aligning with hold goal',
              pass: !!holdGoal?.type && signals.alignmentN >= need,
              detail: holdGoal?.type
                ? `${signals.alignmentN}/${need} aligned`
                : 'gated by hold goal check',
            },
          ];
        }
        if (badgeId.startsWith('reappraisal-')) {
          const need = parseInt(badgeId.split('-')[1] ?? '0', 10);
          return [
            {
              label: 'Counted companion completions across completed pauses',
              pass: signals.reappraisalN >= need,
              detail: `${signals.reappraisalN}/${need} counted companion completes`,
            },
          ];
        }
        if (badgeId.startsWith('awareness-')) {
          const need = parseInt(badgeId.split('-')[1] ?? '0', 10);
          return [
            {
              label: 'Pauses with note > 20 chars OR ≥1 tag OR favorited',
              pass: signals.awarenessN >= need,
              detail: `${signals.awarenessN}/${need} depth pauses`,
            },
          ];
        }
        return [];
    }
  };

  const families: BadgeFamily[] = ['foundation', 'core_skill', 'mastery', 'legacy'];

  return (
    <div className="rounded-xl border border-border/30 bg-card/30 px-4 py-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-sans font-medium">Badge eligibility debug</p>
          <p className="text-[10px] font-mono text-muted-foreground/60">
            Per-rule pass/fail for the current admin user · mirrors `src/lib/badges/compute.ts`
          </p>
        </div>
        <div className="text-right text-[10px] font-mono text-muted-foreground/70 leading-tight">
          <div>user · {user?.id?.slice(0, 8) ?? '—'}…</div>
          <div>
            {completed.length} completed · {rows.length} total · holdGoal={holdGoal?.type ?? 'none'}
          </div>
        </div>
      </div>

      {!ready ? (
        <p className="text-xs text-muted-foreground">Loading pause stats…</p>
      ) : (
        families.map((family) => {
          const items = BADGE_DEFINITIONS.filter((b) => {
            if (b.family !== family) return false;
            // For core ladders we want only the "next unearned" tier per skill
            // so the table doesn't repeat the same counter 3 times.
            if (b.family === 'core_skill') {
              const ladder = BADGE_DEFINITIONS.filter(
                (x) => x.family === 'core_skill' && x.coreSkill === b.coreSkill,
              ).sort((a, c) => (a.tier ?? 0) - (c.tier ?? 0));
              const next = ladder.find(
                (x) => !snapshots.find((s) => s.id === x.id)?.earned,
              );
              return (next ?? ladder[ladder.length - 1]).id === b.id;
            }
            return true;
          });

          return (
            <section key={family} className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#dbb266]">
                {family.replace('_', ' ')}
                {family === 'core_skill' && (
                  <span className="ml-2 text-muted-foreground/60 normal-case">
                    (showing each ladder's current tier; CORE_SKILL_KEYS = {CORE_SKILL_KEYS.join(', ')})
                  </span>
                )}
              </p>
              <div className="space-y-1.5">
                {items.map((b) => {
                  const snap = snapshots.find((s) => s.id === b.id);
                  const checks = checksFor(b.id);
                  const earned = snap?.earned ?? false;
                  return (
                    <div
                      key={b.id}
                      className={cn(
                        'rounded-md border px-3 py-2 space-y-1',
                        earned
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border/30 bg-muted/10',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] font-medium truncate">
                            {b.id}
                          </span>
                          {b.proOnly && (
                            <Lock className="h-2.5 w-2.5 text-[#dbb266]" aria-hidden />
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-mono uppercase tracking-widest',
                            earned ? 'text-nox-accent-green' : 'text-muted-foreground/60',
                          )}
                        >
                          {earned ? 'EARNED' : 'LOCKED'} · {snap?.current ?? 0}/{b.requirement}
                        </span>
                      </div>
                      <ul className="space-y-0.5">
                        {checks.map((c, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-[11px] font-mono leading-snug"
                          >
                            {c.pass ? (
                              <Check className="h-3 w-3 text-nox-accent-green shrink-0 mt-0.5" aria-hidden />
                            ) : (
                              <X className="h-3 w-3 text-destructive/70 shrink-0 mt-0.5" aria-hidden />
                            )}
                            <span className="min-w-0">
                              <span
                                className={cn(
                                  c.pass ? 'text-foreground' : 'text-muted-foreground',
                                )}
                              >
                                {c.label}
                              </span>
                              <span className="block text-muted-foreground/60">{c.detail}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function getRollingWeek(rows: { completed_at: string | null; engaged_at: string | null; created_at: string }[]): number {
  if (rows.length === 0) return 0;
  const days = rows
    .map((r) => {
      const d = new Date(r.completed_at ?? r.engaged_at ?? r.created_at);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    })
    .sort((a, b) => a - b);
  const weekMs = 7 * 86400000;
  let max = 1;
  for (let i = 0; i < days.length; i++) {
    const start = days[i] - (weekMs - 1);
    const set = new Set<number>();
    for (let j = i; j >= 0 && days[j] >= start; j--) set.add(days[j]);
    if (set.size > max) max = set.size;
  }
  return max;
}

function getStreak(rows: { completed_at: string | null; engaged_at: string | null; created_at: string }[]): number {
  if (rows.length === 0) return 0;
  const set = new Set<number>();
  for (const r of rows) {
    const d = new Date(r.completed_at ?? r.engaged_at ?? r.created_at);
    set.add(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
  }
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; ; i++) {
    const t = today.getTime() - i * 86400000;
    if (set.has(t)) streak++;
    else break;
  }
  return streak;
}