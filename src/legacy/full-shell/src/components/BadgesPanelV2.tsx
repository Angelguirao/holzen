import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Lock, Sparkles, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BadgeCelebration } from './BadgeCelebration';
import { useBadgeSync } from '@/legacy/full-shell/src/hooks/use-badge-sync';
import { useBadges } from '@/legacy/full-shell/src/hooks/use-badges';
import { usePauseStatsData } from '@/legacy/full-shell/src/hooks/use-pause-stats-data';
import { CORE_SKILL_KEYS, type BadgeFamily } from '@/legacy/full-shell/src/lib/badges/definitions';
import { cn } from '@/lib/utils';

interface Props {
  subscribed: boolean;
  holdGoal?: { type: string | null; trackedAssetId?: string } | null;
  notifyBadges?: boolean;
}

const FAMILY_ORDER: BadgeFamily[] = ['foundation', 'core_skill', 'mastery', 'legacy'];
const FAMILY_TITLE_KEY: Record<BadgeFamily, string> = {
  foundation: 'badges.familyFoundation',
  core_skill: 'badges.familyCoreSkills',
  mastery: 'badges.familyMastery',
  legacy: 'badges.familyLegacy',
};
const FAMILY_TITLE_DEFAULT: Record<BadgeFamily, string> = {
  foundation: 'Foundation',
  core_skill: 'Core skills',
  mastery: 'Mastery',
  legacy: 'Legacy',
};

/**
 * Pause V2 badge panel.
 *
 * Layout per `docs/systems/badges-system.md` target model:
 *   - 4 family sections in order.
 *   - Core skill ladders render only their "current tier" (first
 *     unearned badge per ladder) + an earned strip above the grid.
 *   - Pro gate restricted to Mastery; Foundation + Core skills +
 *     Legacy are always visible.
 *   - Every card shows per-badge progress (earned, current, requirement).
 */
export function BadgesPanelV2({ subscribed, holdGoal, notifyBadges = true }: Props) {
  const { t } = useTranslation();
  const { rows, stepEvents, companionEvents } = usePauseStatsData();
  const { snapshots, earnedIds, badgeMeta } = useBadges({
    rows,
    stepEvents,
    companionEvents,
    holdGoal,
    trackedAssetId: holdGoal?.trackedAssetId,
  });

  const { newBadges, dismissCelebration } = useBadgeSync(earnedIds, badgeMeta, notifyBadges);

  // Split into families. For core_skill, collapse each ladder into
  // { earned: [...], next: firstUnearned }.
  const grouped = useMemo(() => {
    const byFamily: Record<BadgeFamily, typeof snapshots> = {
      foundation: [],
      core_skill: [],
      mastery: [],
      legacy: [],
    };
    for (const s of snapshots) byFamily[s.family].push(s);

    const coreLadders = CORE_SKILL_KEYS.map((skill) => {
      const tiers = byFamily.core_skill
        .filter((s) => s.coreSkill === skill)
        .sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0));
      const earned = tiers.filter((t) => t.earned);
      const nextTier = tiers.find((t) => !t.earned) ?? tiers[tiers.length - 1];
      return { skill, tiers, earned, next: nextTier };
    });

    return {
      foundation: byFamily.foundation,
      coreLadders,
      mastery: byFamily.mastery,
      legacy: byFamily.legacy,
    };
  }, [snapshots]);

  const totalEarned = earnedIds.length;
  const totalBadges = snapshots.length;

  return (
    <>
      {newBadges.length > 0 && <BadgeCelebration badges={newBadges} onDismiss={dismissCelebration} />}
      <div className="space-y-6">
        {/* Summary */}
        <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-nox-text-highlight" />
              <p className="text-muted-foreground font-sans text-sm">
                <span className="text-foreground font-medium">{totalEarned}</span> / {totalBadges}{' '}
                {t('badges.earned', { defaultValue: 'earned' })}
              </p>
            </div>
            <div className="h-1.5 flex-1 max-w-[120px] ml-4 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${totalBadges === 0 ? 0 : (totalEarned / totalBadges) * 100}%`,
                  backgroundColor: '#C1CBD7',
                }}
              />
            </div>
          </div>
          <Link
            to="/journey/badges/guide"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-3 w-3" aria-hidden />
            {t('badges.howItWorks', { defaultValue: 'How badges work' })}
          </Link>
        </div>

        {FAMILY_ORDER.map((family) => {
          const isCore = family === 'core_skill';
          const title = t(FAMILY_TITLE_KEY[family], {
            defaultValue: FAMILY_TITLE_DEFAULT[family],
          });
          const isMastery = family === 'mastery';
          const showBody =
            !isMastery ||
            (isMastery && subscribed) ||
            // Still list Mastery badges even when locked, just rendered as locked cards.
            isMastery;

          if (isCore) {
            return (
              <div key={family} className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="tracking-widest uppercase text-sm font-sans text-[#dbb266]">
                    {title}
                  </p>
                </div>
                {grouped.coreLadders.map(({ skill, earned, next }) => {
                  return (
                    <LadderCard
                      key={skill}
                      label={t(`stats.skills.${skill}`, { defaultValue: skill })}
                      earnedCount={earned.length}
                      totalTiers={3}
                      next={next}
                    />
                  );
                })}
              </div>
            );
          }

          return (
            <div key={family} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="tracking-widest uppercase text-sm font-sans text-[#dbb266]">
                  {title}
                </p>
              </div>
              {showBody && (
                <div className="grid grid-cols-2 gap-2">
                  {grouped[family as 'foundation' | 'mastery' | 'legacy'].map((b, i) => {
                    const isLocked = b.proOnly && !subscribed;
                    return (
                      <motion.div
                        key={b.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className={cn(
                          'relative rounded-lg border px-3 py-3 space-y-2 transition-all',
                          isLocked
                            ? 'border-border/30 bg-muted/10 opacity-40'
                            : b.earned
                              ? 'border-primary/30 bg-primary/5'
                              : 'border-border/40 bg-muted/20 opacity-70',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <b.icon
                              className="h-3.5 w-3.5 shrink-0 mt-0.5"
                              style={{ color: b.earned && !isLocked ? b.color : undefined }}
                              aria-hidden
                            />
                            <p
                              className={cn(
                                'leading-tight text-sm font-sans font-medium',
                                b.earned && !isLocked
                                  ? 'text-secondary-foreground'
                                  : 'text-secondary-foreground/70',
                              )}
                            >
                              {t(b.labelKey, { defaultValue: b.id })}
                            </p>
                          </div>
                          {b.proOnly && (
                            <div className="flex items-center shrink-0">
                              {isLocked ? (
                                <Lock className="h-2.5 w-2.5 text-[#dbb266]" aria-hidden />
                              ) : (
                                <Sparkles className="h-2.5 w-2.5 text-nox-text-highlight/70" aria-hidden />
                              )}
                            </div>
                          )}
                        </div>
                        <p className="leading-snug text-xs text-muted-foreground">
                          {isLocked
                            ? t('badges.proExclusive', { defaultValue: 'Unlock with Pro' })
                            : t(b.descKey, { defaultValue: '' })}
                        </p>
                        {!b.earned && !isLocked && (
                          <div className="space-y-1">
                            <div className="h-1 w-full rounded-full bg-border/40 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: '#C1CBD7' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${b.progress * 100}%` }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                              />
                            </div>
                            <p className="text-xs font-sans text-secondary-foreground">
                              {b.current} / {b.requirement}{' '}
                              {t(b.unitKey, { defaultValue: '' })}
                            </p>
                          </div>
                        )}
                        {b.earned && !isLocked && (
                          <p className="text-[9px] font-mono text-muted-foreground">
                            {t('badges.earnedCheck', { defaultValue: 'Earned' })}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function LadderCard({
  label,
  earnedCount,
  totalTiers,
  next,
}: {
  label: string;
  earnedCount: number;
  totalTiers: number;
  next: ReturnType<typeof useBadges>['snapshots'][number];
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-sans font-medium capitalize">{label}</p>
        <p className="text-[10px] font-mono text-muted-foreground">
          {earnedCount}/{totalTiers}
        </p>
      </div>
      <div className="flex items-start gap-2">
        <next.icon
          className="h-3.5 w-3.5 shrink-0 mt-0.5"
          style={{ color: next.earned ? next.color : undefined }}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {next.earned
              ? t('badges.ladderComplete', { defaultValue: 'All tiers earned' })
              : t('badges.ladderNext', { defaultValue: 'Next' })}
          </p>
          <p className="text-sm font-sans font-medium">
            {t(next.labelKey, { defaultValue: next.id })}
          </p>
          {!next.earned && (
            <>
              <div className="h-1 w-full rounded-full bg-border/40 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: '#C1CBD7' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${next.progress * 100}%` }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                />
              </div>
              <p className="text-xs font-sans text-secondary-foreground">
                {next.current} / {next.requirement}{' '}
                {t(next.unitKey, { defaultValue: '' })}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
