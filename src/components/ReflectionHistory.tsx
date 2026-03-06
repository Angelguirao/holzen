import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { ShareReflection } from './ShareReflection';

interface Reflection {
  id: string;
  message: string;
  context: string | null;
  created_at: string;
}

export function ReflectionHistory() {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('reflections')
        .select('id, message, context, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setReflections(data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  const deleteReflection = useCallback(async (id: string) => {
    await supabase.from('reflections').delete().eq('id', id);
    setReflections((prev) => prev.filter((r) => r.id !== id));
  }, []);

  if (loading || reflections.length === 0) return null;

  return (
    <div className="space-y-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-mono text-muted-foreground underline"
      >
        {expanded ? 'Hide past reflections' : `Past reflections (${reflections.length})`}
      </button>

      {expanded && (
        <div className="space-y-3">
          {reflections.map((r) => (
            <div
              key={r.id}
              className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-mono text-muted-foreground">
                  {format(new Date(r.created_at), 'MMM d, yyyy · h:mm a')}
                  {r.context && ` — ${r.context}`}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  <ShareReflection message={r.message} context={r.context} />
                  <button
                    onClick={() => deleteReflection(r.id)}
                    className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors p-1"
                    aria-label="Delete reflection"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{r.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
