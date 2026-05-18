import { ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { hapticFeedback } from '@/lib/haptics';
import { FEEDBACK_TO_CACHE_TYPE } from '@/lib/companion-types';
import type { RegenerateCompanionSlot } from '@/features/pause/public';
import { useSubscription } from '@/hooks/use-subscription';
import { useProGate } from '@/hooks/use-pro-gate';
import { showLimitReachedToast, isPaidLimitReached } from '@/lib/limit-upsell';
import { isHolzenDebugEnabled } from '@/lib/holzen-console';
import {
  companionFeedbackVoteQueryKey,
  getCompanionFeedbackVoteQueryOptions,
} from '@/lib/companion-feedback-vote-query';

/** Orchestrate regenerate — dev / non-production builds, or prod + Holzen debug opt-in (see holzen-console). */
function isCompanionRegenerateUiEnabled(): boolean {
  return !import.meta.env.PROD || isHolzenDebugEnabled();
}

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
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [optimisticVote, setOptimisticVote] = useState<'up' | 'down' | null>(null);
  const [loading, setLoading] = useState(false);
  const { isPro, requirePro, startCheckout } = useProGate();
  const { companionRemaining, flexCreditsBalance, applyOptimisticDecrement, refresh: refreshSubscription } = useSubscription();

  useEffect(() => {
    setOptimisticVote(null);
  }, [pauseInstanceId, companionType, userId]);

  const { data: persistedVote = null } = useQuery(
    getCompanionFeedbackVoteQueryOptions(userId, pauseInstanceId, companionType),
  );

  const vote = optimisticVote ?? persistedVote;

  const canRegenerate = Boolean(
    pauseInstanceId && regenerateSlot && onRegenerate && isCompanionRegenerateUiEnabled(),
  );
  const regenBusy = Boolean(regenerating);
  // Pro users hit a true wall when both the monthly companion bucket AND
  // their flex credits are empty — gate the button visually then.
  const limitReached = isPro && isPaidLimitReached({
    remaining: companionRemaining,
    flexCreditsBalance,
  });

  const handleVote = useCallback(async (type: 'up' | 'down') => {
    if (vote || loading || regenBusy) return;
    if (!userId) return;
    setLoading(true);
    setOptimisticVote(type);
    hapticFeedback('light');

    try {
      const cacheType = FEEDBACK_TO_CACHE_TYPE[companionType];

      const { error } = await supabase.from('analytics_events').insert({
        user_id: userId,
        event: 'companion_feedback',
        metadata: {
          companion_type: companionType,
          cache_type: cacheType || companionType,
          vote: type,
          cache_id: cacheId || null,
          pause_instance_id: pauseInstanceId || null,
        },
      });
      if (error) {
        setOptimisticVote(null);
        return;
      }
      if (pauseInstanceId) {
        queryClient.setQueryData<'up' | 'down' | null>(
          companionFeedbackVoteQueryKey(userId, pauseInstanceId, companionType),
          type,
        );
        setOptimisticVote(null);
      }
      // No pause_instance_id: prior UI kept local vote only (no server read key); leave optimistic set.
    } catch {
      setOptimisticVote(null);
    } finally {
      setLoading(false);
    }
  }, [
    vote,
    loading,
    regenBusy,
    userId,
    pauseInstanceId,
    companionType,
    cacheId,
    queryClient,
  ]);

  const handleRegenerate = () => {
    if (!canRegenerate || regenBusy) return;
    // Non-Pro: route through the standard Pro upsell toast.
    if (!isPro) {
      requirePro('companions');
      return;
    }
    // Pro but out of allowance + flex credits: standard limit-reached toast.
    if (limitReached) {
      showLimitReachedToast({ feature: 'regenerate', startCheckout });
      return;
    }
    hapticFeedback('light');
    // Optimistically reflect the spend in the UI immediately; the next
    // subscription refresh reconciles with the server. If the regenerate
    // fails, the refresh below restores accurate counts.
    applyOptimisticDecrement('companion');
    Promise.resolve(onRegenerate?.()).finally(() => {
      void refreshSubscription();
    });
  };

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={() => handleVote('up')}
          disabled={!!vote || loading || regenBusy}
          className={`p-0.5 rounded transition-colors ${
            vote === 'up' ? 'text-nox-text-highlight/90' : vote ? 'text-muted-foreground/10' : 'text-muted-foreground/20 hover:text-nox-text-highlight/60'
          }`}
          aria-label="Thumbs up"
        >
          <ThumbsUp className="h-2.5 w-2.5" />
        </button>
        <button
          onClick={() => handleVote('down')}
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
        onClick={() => handleVote('up')}
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
        onClick={() => handleVote('down')}
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
