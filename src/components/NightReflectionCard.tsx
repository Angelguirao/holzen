import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Moon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NightReflection {
  id: string;
  message: string;
  btc_change_percent: number;
  btc_direction: string;
  created_at: string;
}

export function useNightReflection() {
  const { user } = useAuth();
  const [reflection, setReflection] = useState<NightReflection | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
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
        setLoaded(true);
      });
  }, [user]);

  const dismiss = async () => {
    if (!reflection) return;
    const id = reflection.id;
    setReflection(null);
    await supabase
      .from('night_reflections')
      .update({ dismissed: true } as any)
      .eq('id', id);
  };

  return { reflection, loaded, dismiss };
}

interface Props {
  reflection: NightReflection;
  onDismiss: () => void;
}

export function NightReflectionCard({ reflection, onDismiss }: Props) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Moon className="h-3 w-3" />
          <p className="text-[10px] font-mono uppercase tracking-wider">{t('nightReflection.title')}</p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors p-0.5"
          aria-label={t('common.done')}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <p className="text-sm leading-relaxed">{reflection.message}</p>
    </div>
  );
}
