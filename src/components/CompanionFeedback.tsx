import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from '@/lib/haptics';

interface Props {
  reflectionId?: string | null;
  companionType: string;
}

export function CompanionFeedback({ reflectionId, companionType }: Props) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);

  const handleVote = async (type: 'up' | 'down') => {
    if (vote) return;
    setVote(type);
    hapticFeedback('light');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Map companion types to cache types for feedback tracking
      const cacheTypeMap: Record<string, string> = {
        learning: 'ground_nudge',
        signal: 'signal',
        zoom_out: 'zoom_out_deep_time',
        history_insight: 'historical_insight',
      };
      const cacheType = cacheTypeMap[companionType];

      // Find the most recent cache entry of this type to link feedback
      let cacheId: string | null = null;
      if (cacheType) {
        const { data: cacheEntries } = await supabase
          .from('companion_cache')
          .select('id')
          .eq('companion_type', cacheType)
          .order('created_at', { ascending: false })
          .limit(1);
        cacheId = cacheEntries?.[0]?.id || null;
      }

      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event: 'companion_feedback',
        metadata: {
          companion_type: companionType,
          cache_type: cacheType || companionType,
          vote: type,
          cache_id: cacheId,
          reflection_id: reflectionId,
        },
      });
    } catch {
      // Non-critical, fail silently
    }
  };

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <span className="text-[9px] text-muted-foreground/30 font-mono">Helpful?</span>
      <button
        onClick={() => handleVote('up')}
        disabled={!!vote}
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
        disabled={!!vote}
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
