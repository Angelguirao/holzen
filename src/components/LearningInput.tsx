import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink } from 'lucide-react';

interface NudgeData {
  title: string;
  body: string;
  citation: string;
  url: string;
}

interface Props {
  title: string;
  body: string;
  context?: string | null;
  useGroundNudge?: boolean;
}

export function LearningInput({ title, body, context, useGroundNudge = true }: Props) {
  const [nudge, setNudge] = useState<NudgeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!useGroundNudge) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    supabase.functions
      .invoke('ground-nudge', { body: { context: context ?? '' } })
      .then(({ data, error: fnError }) => {
        if (cancelled) return;
        if (fnError || !data || data.error) {
          setError(true);
        } else {
          setNudge(data as NudgeData);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [useGroundNudge, context]);

  // Fallback to passed-in content if AI fails
  const displayTitle = nudge?.title ?? (error ? title : '');
  const displayBody = nudge?.body ?? (error ? body : '');

  if (loading) {
    return (
      <div className="py-3 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs font-mono">Finding research…</span>
      </div>
    );
  }

  if (!displayTitle && !displayBody) return null;

  return (
    <div className="py-3 space-y-1.5">
      <p className="text-xs font-mono font-medium text-foreground/80">{displayTitle}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{displayBody}</p>
      {nudge?.citation && (
        <div className="flex items-center gap-1.5 pt-1">
          <p className="text-[9px] font-mono text-muted-foreground/40">
            {nudge.citation}
          </p>
          {nudge.url && (
            <a
              href={nudge.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/50 hover:text-primary transition-colors"
              aria-label="View research"
            >
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      )}
      {error && !nudge && (
        <p className="text-[9px] font-mono text-muted-foreground/30 pt-1">
          Behavioral science · Research-grounded
        </p>
      )}
    </div>
  );
}
