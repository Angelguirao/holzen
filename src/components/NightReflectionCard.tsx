import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Moon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { homeInWidget } from '@/components/home/home-widget-styles';

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
    <div className={`${homeInWidget.insetMuted} space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Moon className="h-3 w-3 shrink-0" />
          <p className={homeInWidget.kicker}>{t('nightReflection.title')}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className={homeInWidget.iconBtn}
          aria-label={t('common.done')}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <p className={homeInWidget.body}>{reflection.message}</p>
    </div>
  );
}
