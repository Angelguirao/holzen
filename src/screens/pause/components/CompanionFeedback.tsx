import { useTranslation } from 'react-i18next';
import { hapticFeedback } from '@/lib/haptics';
import type { RegenerateCompanionSlot } from '@/features/pause/public';
import {
  isCompanionRegenerateUiEnabled,
  useCompanionFeedbackVote,
} from '@/features/pause/public-hooks';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useProGate } from '@/features/subscription/public-hooks';
import { isPaidLimitReached, showLimitReachedToast } from '@/features/subscription/public-limits';
import { CompanionFeedbackRegenerateButton } from '@/screens/pause/components/companion/companion-feedback-regenerate-button';
import { CompanionFeedbackVoteButtons } from '@/screens/pause/components/companion/companion-feedback-vote-buttons';
import { resolveCompanionRegenerateClick } from '@/screens/pause/lib/companion-feedback-regenerate';

interface Props {
  /** Reflection ID this companion belongs to */
  pauseInstanceId?: string | null;
  /** Companion type key (e.g. 'signal', 'grounding', 'zoom_out', 'history_insight') */
  companionType: string;
  /** Cache entry ID for quality score correlation */
  cacheId?: string | null;
  /** Compact mode for inline use in library items */
  compact?: boolean;
  /** AI slot for single-slot regenerate (orchestrate regenerateOnly) */
  regenerateSlot?: RegenerateCompanionSlot;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

/**
 * Thumbs up/down feedback for companion content.
 * Persists vote state so the user can't vote twice on the same reflection+companion.
 */
export function CompanionFeedback({
  pauseInstanceId,
  companionType,
  cacheId,
  compact,
  regenerateSlot,
  onRegenerate,
  regenerating,
}: Props) {
  const { t } = useTranslation();
  const { isPro, requirePro, startCheckout } = useProGate();
  const { companionRemaining, flexCreditsBalance, applyOptimisticDecrement, refresh: refreshSubscription } =
    useSubscription();

  const regenBusy = Boolean(regenerating);
  const { vote, loading, handleVote } = useCompanionFeedbackVote({
    pauseInstanceId,
    companionType,
    cacheId,
    interactionBlocked: regenBusy,
  });

  const canRegenerate = Boolean(
    pauseInstanceId && regenerateSlot && onRegenerate && isCompanionRegenerateUiEnabled(),
  );
  const limitReached = isPro && isPaidLimitReached({
    remaining: companionRemaining,
    flexCreditsBalance,
  });

  const voteDisabled = Boolean(vote) || loading || regenBusy;

  const handleRegenerate = () => {
    const outcome = resolveCompanionRegenerateClick({
      canRegenerate,
      regenBusy,
      isPro,
      limitReached,
    });
    if (outcome.action === 'require_pro') {
      requirePro('companions');
      return;
    }
    if (outcome.action === 'limit_reached') {
      showLimitReachedToast({ feature: 'regenerate', startCheckout });
      return;
    }
    if (outcome.action !== 'run') return;

    hapticFeedback('light');
    applyOptimisticDecrement('companion');
    Promise.resolve(onRegenerate?.()).finally(() => {
      void refreshSubscription();
    });
  };

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1">
        <CompanionFeedbackVoteButtons
          vote={vote}
          loading={loading}
          disabled={voteDisabled}
          onVote={(type) => void handleVote(type)}
          compact
        />
        {canRegenerate ? (
          <CompanionFeedbackRegenerateButton compact regenBusy={regenBusy} onClick={handleRegenerate} />
        ) : null}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
      <span className="text-[9px] text-muted-foreground/30 font-mono">{t('companions.helpfulQuestion')}</span>
      <CompanionFeedbackVoteButtons
        vote={vote}
        loading={loading}
        disabled={voteDisabled}
        onVote={(type) => void handleVote(type)}
      />
      {vote ? (
        <span className="text-[9px] text-muted-foreground/30 font-mono">
          {vote === 'up' ? t('companions.feedbackThanksUp') : t('companions.feedbackThanksDown')}
        </span>
      ) : null}
      {canRegenerate ? (
        <CompanionFeedbackRegenerateButton regenBusy={regenBusy} onClick={handleRegenerate} />
      ) : null}
    </div>
  );
}
