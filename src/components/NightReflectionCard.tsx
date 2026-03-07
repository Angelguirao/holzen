import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Moon, X } from 'lucide-react';

interface NightReflection {
  id: string;
  message: string;
  btc_change_percent: number;
  btc_direction: string;
  created_at: string;
}

export function NightReflectionCard() {
  const { user } = useAuth();
  const [reflection, setReflection] = useState<NightReflection | null>(null);

  useEffect(() => {
    if (!user) return;
    // Fetch latest undismissed night reflection
    supabase
      .from('night_reflections')
      .select('id, message, btc_change_percent, btc_direction, created_at')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setReflection(data[0] as unknown as NightReflection);
        }
      });
  }, [user]);

  const dismiss = async () => {
    if (!reflection) return;
    setReflection(null);
    await supabase
      .from('night_reflections')
      .update({ dismissed: true } as any)
      .eq('id', reflection.id);
  };

  if (!reflection) return null;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Moon className="h-3 w-3" />
          <p className="text-[10px] font-mono uppercase tracking-wider">Night reflection</p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors p-0.5"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <p className="text-sm leading-relaxed">{reflection.message}</p>
    </div>
  );
}
