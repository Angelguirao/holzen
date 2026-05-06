import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

export const NIGHT_REFLECTION_VISIBLE_QUERY_KEY = (userId: string) =>
  ['night-reflections', 'visible', userId] as const;

async function fetchVisibleNightReflection(userId: string): Promise<NightReflection | null> {
  const locallyDismissed = new Set(readDismissedIds(userId));
  const { data, error } = await supabase
    .from('night_reflections')
    .select('id, message, btc_change_percent, btc_direction, created_at')
    .eq('user_id', userId)
    .eq('dismissed', false)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error || !data?.length) return null;
  const firstVisible = data.find((item) => !locallyDismissed.has(item.id));
  return firstVisible ? (firstVisible as unknown as NightReflection) : null;
}

export function useNightReflection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: reflection = null, isFetched } = useQuery({
    queryKey: userId ? NIGHT_REFLECTION_VISIBLE_QUERY_KEY(userId) : ['night-reflections', 'visible', 'none'],
    queryFn: () => fetchVisibleNightReflection(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const loaded = Boolean(userId) && isFetched;

  const dismiss = useCallback(async () => {
    if (!reflection || !userId) return;
    const id = reflection.id;
    queryClient.setQueryData<NightReflection | null>(NIGHT_REFLECTION_VISIBLE_QUERY_KEY(userId), null);
    const dismissedIds = readDismissedIds(userId);
    if (!dismissedIds.includes(id)) {
      writeDismissedIds(userId, [...dismissedIds, id]);
    }

    try {
      await supabase
        .from('night_reflections')
        .update({ dismissed: true })
        .eq('user_id', userId)
        .eq('dismissed', false);
    } finally {
      await queryClient.invalidateQueries({ queryKey: NIGHT_REFLECTION_VISIBLE_QUERY_KEY(userId) });
    }
  }, [reflection, userId, queryClient]);

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
