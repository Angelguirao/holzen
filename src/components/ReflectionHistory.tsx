import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';

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
        <div className="space-y-6">
          {reflections.map((r) => (
            <div key={r.id} className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">
                {format(new Date(r.created_at), 'MMM d, yyyy · h:mm a')}
                {r.context && ` — ${r.context}`}
              </p>
              <p className="text-sm leading-relaxed">{r.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
