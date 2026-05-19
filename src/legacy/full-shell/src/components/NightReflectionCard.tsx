import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Moon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import {
  type NightReflection,
  NIGHT_REFLECTION_VISIBLE_QUERY_KEY,
  getVisibleNightReflectionQueryOptions,
  readNightReflectionDismissedIds,
  writeNightReflectionDismissedIds,
} from '@/lib/night-reflection-visible-query';

export {
  NIGHT_REFLECTION_VISIBLE_QUERY_KEY,
  fetchVisibleNightReflection,
} from '@/lib/night-reflection-visible-query';

export function useNightReflection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: reflection = null, isFetched } = useQuery(getVisibleNightReflectionQueryOptions(userId));

  const loaded = Boolean(userId) && isFetched;

  const dismiss = useCallback(async () => {
    if (!reflection || !userId) return;
    const id = reflection.id;
    queryClient.setQueryData<NightReflection | null>(NIGHT_REFLECTION_VISIBLE_QUERY_KEY(userId), null);
    const dismissedIds = readNightReflectionDismissedIds(userId);
    if (!dismissedIds.includes(id)) {
      writeNightReflectionDismissedIds(userId, [...dismissedIds, id]);
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
