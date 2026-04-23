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

function getDismissedCacheKey(userId: string) {
  return `holzen_night_reflection_dismissed_${userId}`;
}

function readDismissedIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(getDismissedCacheKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeDismissedIds(userId: string, ids: string[]) {
  try {
    // Keep only the latest handful to avoid unbounded growth.
    localStorage.setItem(getDismissedCacheKey(userId), JSON.stringify(ids.slice(-50)));
  } catch {
    // ignore local cache write failures
  }
}

export function useNightReflection() {
  const { user } = useAuth();
  const [reflection, setReflection] = useState<NightReflection | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const locallyDismissed = new Set(readDismissedIds(user.id));
    supabase
      .from('night_reflections')
      .select('id, message, btc_change_percent, btc_direction, created_at')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const firstVisible = data.find((item) => !locallyDismissed.has(item.id));
          if (firstVisible) {
            setReflection(firstVisible as unknown as NightReflection);
          } else {
            setReflection(null);
          }
        } else {
          setReflection(null);
        }
        setLoaded(true);
      });
  }, [user]);

  const dismiss = async () => {
    if (!reflection || !user) return;
    const id = reflection.id;
    setReflection(null);
    const dismissedIds = readDismissedIds(user.id);
    if (!dismissedIds.includes(id)) {
      writeDismissedIds(user.id, [...dismissedIds, id]);
    }

    await supabase
      .from('night_reflections')
      .update({ dismissed: true } as any)
      .eq('user_id', user.id)
      .eq('dismissed', false);
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
