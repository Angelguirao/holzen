import { ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from '@/lib/haptics';
import { FEEDBACK_TO_CACHE_TYPE } from '@/lib/companion-types';
import type { RegenerateCompanionSlot } from '@/hooks/use-companion-data';
import { useSubscription } from '@/hooks/use-subscription';
import { useProGate } from '@/hooks/use-pro-gate';
import { showLimitReachedToast, isPaidLimitReached } from '@/lib/limit-upsell';
import type { Json } from '@/integrations/supabase/types';

function voteFromMetadata(metadata: Json | null | undefined): 'up' | 'down' | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const v = (metadata as Record<string, unknown>).vote;
  return v === 'up' || v === 'down' ? v : null;
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
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [loading, setLoading] = useState(false);
  const { isPro, requirePro, startCheckout } = useProGate();
  const { companionRemaining, flexCreditsBalance, applyOptimisticDecrement, refresh: refreshSubscription } = useSubscription();

  const canRegenerate = Boolean(pauseInstanceId && regenerateSlot && onRegenerate);
  const regenBusy = Boolean(regenerating);
  // Pro users hit a true wall when both the monthly companion bucket AND
  // their flex credits are empty — gate the button visually then.
  const limitReached = isPro && isPaidLimitReached({
    remaining: companionRemaining,
    flexCreditsBalance,
  });

  // Load existing vote on mount (check if user already voted for this reflection+companion)
  useEffect(() => {
    if (!pauseInstanceId) return;

    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data } = await supabase
          .from('analytics_events')
          .select('metadata')
          .eq('user_id', user.id)
          .eq('event', 'companion_feedback')
          .filter('metadata->>pause_instance_id', 'eq', pauseInstanceId)
          .filter('metadata->>companion_type', 'eq', companionType)
          .limit(1);

        if (cancelled || !data || data.length === 0) return;

        setVote(voteFromMetadata(data[0].metadata));
      } catch {
        // Non-critical
      }
    })();

    return () => { cancelled = true; };
  }, [pauseInstanceId, companionType]);

  const handleVote = async (type: 'up' | 'down') => {
    if (vote || loading || regenBusy) return;
    setLoading(true);
    setVote(type);
    hapticFeedback('light');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setVote(null); return; }

      const cacheType = FEEDBACK_TO_CACHE_TYPE[companionType];

      const { error } = await supabase.from('analytics_events').insert({
        user_id: user.id,
        event: 'companion_feedback',
        metadata: {
          companion_type: companionType,
          cache_type: cacheType || companionType,
          vote: type,
          cache_id: cacheId || null,
          pause_instance_id: pauseInstanceId || null,
        },
      });
      if (error) setVote(null); // rollback optimistic update on failure
    } catch {
      setVote(null); // rollback on unexpected error
    } finally {
      setLoading(false);
    }
  };

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
