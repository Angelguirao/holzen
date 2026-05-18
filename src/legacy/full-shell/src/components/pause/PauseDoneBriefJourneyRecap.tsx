import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { useBadges } from '@/hooks/use-badges';
import { useHoldGoalProfile } from '@/hooks/use-hold-goal';
import { usePauseStatsData } from '@/hooks/use-pause-stats-data';
import { suppressBadgeCelebrationOverlayThisSession } from '@/hooks/use-badge-sync';
import { getUserBadgeIdsQueryOptions } from '@/legacy/full-shell/src/lib/user-badge-ids-query';
import type { PauseImpactData } from '@/lib/pause-impact-data';
import { ScoreImpact } from './ScoreImpact';

interface Props {
  pauseData?: PauseImpactData | null;
}

/**
 * Brief done: qualitative “what this pause feeds into Journey” (no fake +N)
 * plus any badges newly eligible vs `user_badges` (same diff `useBadgeSync`
 * would upsert). Celebration overlay is session-deduped so Journey does not
 * repeat the same confetti if the user opens Badges later.
 */
export function PauseDoneBriefJourneyRecap({ pauseData }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const { rows, stepEvents, companionEvents, ready: statsReady } = usePauseStatsData();
  const { data: holdGoal } = useHoldGoalProfile();

  const badgeIdsQuery = useQuery({
    ...getUserBadgeIdsQueryOptions({ userId, enabled: Boolean(userId) }),
  });

  const { earnedIds, badgeMeta } = useBadges({
    rows,
    stepEvents,
    companionEvents,
    holdGoal: holdGoal ?? null,
    trackedAssetId: holdGoal?.trackedAssetId,
  });

  const newlyEligibleIds = useMemo(() => {
    if (!userId || !statsReady || !badgeIdsQuery.isFetched || badgeIdsQuery.isError) return [];
    const persisted = new Set(badgeIdsQuery.data ?? []);
    return earnedIds.filter((id) => !persisted.has(id));
  }, [userId, statsReady, badgeIdsQuery.isFetched, badgeIdsQuery.isError, badgeIdsQuery.data, earnedIds]);

  const newBadgeLabels = useMemo(
    () =>
      newlyEligibleIds.map((id) => ({
        id,
        label: badgeMeta[id]?.label ?? id,
      })),
    [newlyEligibleIds, badgeMeta],
  );

  useEffect(() => {
    if (newlyEligibleIds.length === 0) return;
    suppressBadgeCelebrationOverlayThisSession(newlyEligibleIds);
  }, [newlyEligibleIds]);

  const badgesLoading = Boolean(userId) && (!statsReady || badgeIdsQuery.isPending);

  const showNoNewBadgesLine =
    Boolean(userId) &&
    !badgesLoading &&
    badgeIdsQuery.isFetched &&
    !badgeIdsQuery.isError &&
    newBadgeLabels.length === 0;

  return (
    <div className="w-full max-w-md space-y-5 text-center">
      {pauseData ? <ScoreImpact data={pauseData} variant="brief" className="mx-auto" /> : null}

      {pauseData ? (
        <p className="mx-auto max-w-sm text-[10px] leading-relaxed text-muted-foreground">
          {t('pause.brief.done.contributionFootnote', {
            defaultValue:
              'These lines describe signals Journey uses over many pauses — not live point totals.',
          })}
        </p>
      ) : null}

      {badgesLoading ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground animate-pulse">
          {t('pause.brief.done.badgesChecking', { defaultValue: 'Checking badges…' })}
        </p>
      ) : newBadgeLabels.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('pause.brief.done.newBadgesTitle', { defaultValue: 'Badges unlocked' })}
          </p>
          <ul className="mx-auto max-w-sm list-none space-y-1.5 text-left text-sm leading-snug text-foreground">
            {newBadgeLabels.map((b) => (
              <li key={b.id} className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-nox-accent-green" aria-hidden />
                <span>{b.label}</span>
              </li>
            ))}
          </ul>
          <p className="mx-auto max-w-sm text-[10px] leading-relaxed text-muted-foreground">
            {t('pause.brief.done.newBadgesFootnote', {
              defaultValue: 'Saved to your profile — same list Journey → Badges would sync.',
            })}
          </p>
        </div>
      ) : showNoNewBadgesLine ? (
        <p className="mx-auto max-w-sm text-[11px] leading-relaxed text-muted-foreground">
          {t('pause.brief.done.newBadgesNone', {
            defaultValue:
              "No new badges this pause — you're still progressing toward the next ones. Open Journey → Badges anytime to see what's close.",
          })}
        </p>
      ) : null}
    </div>
  );
}
