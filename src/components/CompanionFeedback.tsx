import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from '@/lib/haptics';
import { FEEDBACK_TO_CACHE_TYPE } from '@/lib/companion-types';

interface Props {
  /** Reflection ID this companion belongs to */
  reflectionId?: string | null;
  /** Companion type key (e.g. 'signal', 'learning', 'zoom_out', 'history_insight') */
  companionType: string;
  /** Cache entry ID for quality score correlation */
  cacheId?: string | null;
  /** Compact mode for inline use in library items */
  compact?: boolean;
}

/**
 * Thumbs up/down feedback for companion content.
 * Persists vote state so the user can't vote twice on the same reflection+companion.
 */
export function CompanionFeedback({ reflectionId, companionType, cacheId, compact }: Props) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [loading, setLoading] = useState(false);

  // Load existing vote on mount (check if user already voted for this reflection+companion)
  useEffect(() => {
    if (!reflectionId) return;

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
          .limit(20);

        if (cancelled || !data) return;

        // Find an existing vote for this reflection+companion
        const existing = data.find((row: any) => {
          const meta = row.metadata as any;
          return meta?.reflection_id === reflectionId && meta?.companion_type === companionType;
        });

        if (existing) {
          setVote((existing.metadata as any)?.vote ?? null);
        }
      } catch {
        // Non-critical
      }
    })();

    return () => { cancelled = true; };
  }, [reflectionId, companionType]);

  const handleVote = async (type: 'up' | 'down') => {
    if (vote || loading) return;
    setLoading(true);
    setVote(type);
    hapticFeedback('light');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cacheType = FEEDBACK_TO_CACHE_TYPE[companionType];

      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event: 'companion_feedback',
        metadata: {
          companion_type: companionType,
          cache_type: cacheType || companionType,
          vote: type,
          cache_id: cacheId || null,
          reflection_id: reflectionId || null,
        },
      });
    } catch {
      // Non-critical, fail silently
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={() => handleVote('up')}
          disabled={!!vote || loading}
          className={`p-0.5 rounded transition-colors ${
            vote === 'up' ? 'text-primary/70' : vote ? 'text-muted-foreground/10' : 'text-muted-foreground/20 hover:text-primary/50'
          }`}
          aria-label="Thumbs up"
        >
          <ThumbsUp className="h-2.5 w-2.5" />
        </button>
        <button
          onClick={() => handleVote('down')}
          disabled={!!vote || loading}
          className={`p-0.5 rounded transition-colors ${
            vote === 'down' ? 'text-destructive/70' : vote ? 'text-muted-foreground/10' : 'text-muted-foreground/20 hover:text-destructive/50'
          }`}
          aria-label="Thumbs down"
        >
          <ThumbsDown className="h-2.5 w-2.5" />
        </button>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <span className="text-[9px] text-muted-foreground/30 font-mono">Helpful?</span>
      <button
        onClick={() => handleVote('up')}
        disabled={!!vote || loading}
        className={`p-1 rounded transition-colors ${
          vote === 'up'
            ? 'text-primary/70'
            : vote
            ? 'text-muted-foreground/10'
            : 'text-muted-foreground/25 hover:text-primary/50'
        }`}
        aria-label="Thumbs up"
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button
        onClick={() => handleVote('down')}
        disabled={!!vote || loading}
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
        <span className="text-[9px] text-muted-foreground/30 font-mono ml-1">
          {vote === 'up' ? 'Thanks!' : 'Noted'}
        </span>
      )}
    </div>
  );
}
