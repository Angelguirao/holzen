import { ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
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

  const handleRegenerate = () => {
    if (!canRegenerate || regenBusy) return;
    if (!isPro) {
      requirePro('companions');
      return;
    }
    if (limitReached) {
      showLimitReachedToast({ feature: 'regenerate', startCheckout });
      return;
    }
    hapticFeedback('light');
    applyOptimisticDecrement('companion');
    Promise.resolve(onRegenerate?.()).finally(() => {
      void refreshSubscription();
    });
  };

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={() => void handleVote('up')}
          disabled={!!vote || loading || regenBusy}
          className={`p-0.5 rounded transition-colors ${
            vote === 'up' ? 'text-nox-text-highlight/90' : vote ? 'text-muted-foreground/10' : 'text-muted-foreground/20 hover:text-nox-text-highlight/60'
          }`}
          aria-label="Thumbs up"
        >
          <ThumbsUp className="h-2.5 w-2.5" />
        </button>
        <button
          onClick={() => void handleVote('down')}
          disabled={!!vote || loading || regenBusy}
          className={`p-0.5 rounded transition-colors ${
            vote === 'down' ? 'text-destructive/70' : vote ? 'text-muted-foreground/10' : 'text-muted-foreground/20 hover:text-destructive/50'
          }`}
          aria-label="Thumbs down"
        >
          <ThumbsDown className="h-2.5 w-2.5" />
        </button>
        {canRegenerate && (
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenBusy}
            className="p-0.5 rounded transition-colors text-muted-foreground/25 hover:text-nox-text-link/70 disabled:opacity-30"
            aria-label={t('companions.regenerate')}
            title={t('companions.regenerate')}
          >
            <RefreshCw className={`h-2.5 w-2.5 ${regenBusy ? 'animate-spin' : ''}`} />
          </button>
        )}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
      <span className="text-[9px] text-muted-foreground/30 font-mono">{t('companions.helpfulQuestion')}</span>
      <button
        onClick={() => void handleVote('up')}
        disabled={!!vote || loading || regenBusy}
        className={`p-1 rounded transition-colors ${
          vote === 'up'
            ? 'text-nox-text-highlight/90'
            : vote
            ? 'text-muted-foreground/10'
            : 'text-muted-foreground/25 hover:text-nox-text-highlight/60'
        }`}
        aria-label="Thumbs up"
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button
        onClick={() => void handleVote('down')}
        disabled={!!vote || loading || regenBusy}
        className={`p-1 rounded transition-colors ${
          vote === 'down'
            ? 'text-destructive/70'
            : vote
            ? 'text-muted-foreground/10'
            : 'text-muted-foreground/25 hover:text-destructive/50'
        }`}
        aria-label="Thumbs down"
      >
        <ThumbsDown className="h-3 w-3" />
      </button>
      {vote && (
        <span className="text-[9px] text-muted-foreground/30 font-mono">
          {vote === 'up' ? t('companions.feedbackThanksUp') : t('companions.feedbackThanksDown')}
        </span>
      )}
      {canRegenerate && (
        <>
          <span className="text-[9px] text-muted-foreground/20 font-mono hidden sm:inline">·</span>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenBusy}
            className="inline-flex items-center gap-1 text-[9px] font-sans font-medium text-muted-foreground/40 hover:text-nox-text-link/80 disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${regenBusy ? 'animate-spin' : ''}`} />
            {regenBusy ? t('companions.regenerating') : t('companions.regenerate')}
          </button>
        </>
      )}
    </div>
  );
}
