import { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Waves, PenLine, Activity, History, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { TOOLS } from '@/lib/app-routes';

type PracticeId = 'checkin' | 'journal' | 'bodyscan' | 'replay';

const PRACTICES = [
  { id: 'checkin' as const, icon: Waves, labelKey: 'practice.checkinLabel', descKey: 'practice.checkinDesc', free: true, route: TOOLS.practice.checkin },
  { id: 'journal' as const, icon: PenLine, labelKey: 'practice.journalLabel', descKey: 'practice.journalDesc', free: false, route: TOOLS.practice.journal },
  { id: 'bodyscan' as const, icon: Activity, labelKey: 'practice.bodyscanLabel', descKey: 'practice.bodyscanDesc', free: false, route: TOOLS.practice.bodyscan },
  { id: 'replay' as const, icon: History, labelKey: 'practice.replayLabel', descKey: 'practice.replayDesc', free: false, route: TOOLS.practice.replay },
] as const;

function useSuggestion(userId: string | undefined) {
  const [suggestion, setSuggestion] = useState<{ id: PracticeId; reason: string } | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: entries } = await supabase
        .from('practice_entries')
        .select('type, mood, created_at')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!entries || entries.length === 0) {
        setSuggestion({
          id: 'checkin',
          reason: t('practice.suggestFirstCheckin', { defaultValue: 'Start with a quick emotional check-in' }),
        });
        return;
      }

      const counts: Record<string, number> = {};
      for (const e of entries) counts[e.type] = (counts[e.type] || 0) + 1;

      const lastCheckin = entries.find(e => e.type === 'checkin');
      const daysSinceCheckin = lastCheckin
        ? Math.floor((Date.now() - new Date(lastCheckin.created_at).getTime()) / 86400000)
        : 999;

      const reactiveMoods = ['anxious', 'fearful', 'fomo'];
      const recentMoods = entries.filter(e => e.mood && reactiveMoods.includes(e.mood));

      if (daysSinceCheckin >= 3) {
        setSuggestion({
          id: 'checkin',
          reason: t('practice.suggestCheckin', { defaultValue: "It's been a few days — how are you feeling?" }),
        });
      } else if (recentMoods.length >= 2) {
        setSuggestion({
          id: 'bodyscan',
          reason: t('practice.suggestBodyscan', { defaultValue: "You've been reactive — try grounding yourself" }),
        });
      } else if (!counts['journal'] || counts['journal'] < 2) {
        setSuggestion({
          id: 'journal',
          reason: t('practice.suggestJournal', { defaultValue: 'A guided journal might surface new patterns' }),
        });
      } else {
        setSuggestion({
          id: 'replay',
          reason: t('practice.suggestReplay', { defaultValue: 'Revisit a past reflection with fresh eyes' }),
        });
      }
    })();
  }, [userId, t]);

  return suggestion;
}

function useWeeklyProgress(userId: string | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: c } = await supabase
        .from('practice_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo);
      setCount(c ?? 0);
    })();
  }, [userId]);

  return count;
}

export function PracticeWidget() {
  const { t } = useTranslation();
  const { subscribed, startCheckout } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const rawSuggestion = useSuggestion(user?.id);
  const weeklyCount = useWeeklyProgress(user?.id);

  // Only show AI suggestion for Pro users, or if it suggests a free practice
  const suggestion = rawSuggestion && (subscribed || PRACTICES.find(p => p.id === rawSuggestion.id)?.free)
    ? rawSuggestion
    : null;

  const handleSelect = useCallback((id: PracticeId) => {
    const practice = PRACTICES.find(p => p.id === id);
    if (!practice) return;
    if (!practice.free && !subscribed) {
      const descKey = `pro.desc_${id}`;
      const description = t(descKey) !== descKey ? t(descKey) : t('pro.upgradeDesc');
      toast(t('pro.featureLocked'), {
        description,
        action: { label: t('pro.upgradeCta'), onClick: () => startCheckout() },
        duration: 6000,
      });
      return;
    }
    navigate(practice.route);
  }, [subscribed, startCheckout, t, navigate]);

  return (
    <div className="space-y-3">
      {/* Weekly progress */}
      <div className="flex items-center justify-between">
        <p className={homeInWidget.bodyMuted}>{t('practice.intro')}</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < Math.min(weeklyCount, 7) ? 'bg-primary/40' : 'bg-border/30'
            }`}
          />
        ))}
      </div>

      {/* Contextual suggestion */}
      {suggestion && (
        <button
          onClick={() => handleSelect(suggestion.id)}
          className="flex w-full items-start gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-3 transition-colors hover:bg-primary/[0.07]"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 mt-[6px] text-secondary-foreground" />
          <div className="min-w-0 flex-1 text-left">
            <span className={`${homeInWidget.kicker} text-primary`}>
              {t('practice.suggested', { defaultValue: 'Suggested' })}
            </span>
            <span className={`mt-1 block ${homeInWidget.bodyMuted} leading-snug`}>
              {suggestion.reason}
            </span>
          </div>
          <ChevronRight className="h-3 w-3 text-primary/30 shrink-0 mt-[5px]" />
        </button>
      )}

      {/* All exercises */}
      <div className="space-y-1.5">
        {PRACTICES.map((p) => {
          const Icon = p.icon;
          const locked = !p.free && !subscribed;
          return (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className="w-full gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/30 group py-2.5 flex items-start justify-start"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 mt-[6px] text-secondary-foreground" />
              <div className="min-w-0 flex-1 text-left">
                <span className="text-sm font-medium text-foreground transition-colors group-hover:text-foreground">
                  {t(p.labelKey)}
                </span>
                <span className="mt-0.5 block leading-snug text-muted-foreground text-sm">
                  {t(p.descKey)}
                </span>
              </div>
              {locked ? (
                <Lock className="h-3 w-3 text-muted-foreground/30 shrink-0 mt-[6px]" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0 mt-[6px]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
