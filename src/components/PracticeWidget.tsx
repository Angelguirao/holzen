import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Waves, PenLine, Activity, History, Lock, X, ChevronRight, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionalCheckIn } from '@/components/practice/EmotionalCheckIn';
import { GuidedJournal } from '@/components/practice/GuidedJournal';
import { BodyScan } from '@/components/practice/BodyScan';
import { ReflectionReplay } from '@/components/practice/ReflectionReplay';

type PracticeId = 'checkin' | 'journal' | 'bodyscan' | 'replay';

const PRACTICES = [
  { id: 'checkin' as const, icon: Waves, labelKey: 'practice.checkinLabel', descKey: 'practice.checkinDesc', free: true },
  { id: 'journal' as const, icon: PenLine, labelKey: 'practice.journalLabel', descKey: 'practice.journalDesc', free: false },
  { id: 'bodyscan' as const, icon: Activity, labelKey: 'practice.bodyscanLabel', descKey: 'practice.bodyscanDesc', free: false },
  { id: 'replay' as const, icon: History, labelKey: 'practice.replayLabel', descKey: 'practice.replayDesc', free: false },
] as const;

const INLINE_COLORS = {
  textColor: 'hsl(var(--foreground) / 0.7)',
  ringColor: 'hsl(var(--border))',
  glowColor: 'hsl(var(--primary) / 0.1)',
};

/** Pick a contextual suggestion based on recent practice data */
function useSuggestion(userId: string | undefined) {
  const [suggestion, setSuggestion] = useState<{ id: PracticeId; reason: string } | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get recent practice entries
      const { data: entries } = await supabase
        .from('practice_entries')
        .select('type, mood, created_at')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!entries || entries.length === 0) {
        setSuggestion({ id: 'checkin', reason: t('practice.suggestFirstCheckin', 'Start with a quick emotional check-in') });
        return;
      }

      // Count by type
      const counts: Record<string, number> = {};
      for (const e of entries) counts[e.type] = (counts[e.type] || 0) + 1;

      // Check last checkin
      const lastCheckin = entries.find(e => e.type === 'checkin');
      const daysSinceCheckin = lastCheckin
        ? Math.floor((Date.now() - new Date(lastCheckin.created_at).getTime()) / 86400000)
        : 999;

      // Check recent moods for reactivity
      const reactiveMoods = ['anxious', 'fearful', 'fomo'];
      const recentMoods = entries.filter(e => e.mood && reactiveMoods.includes(e.mood));

      if (daysSinceCheckin >= 3) {
        setSuggestion({ id: 'checkin', reason: t('practice.suggestCheckin', "It's been a few days — how are you feeling?") });
      } else if (recentMoods.length >= 2) {
        setSuggestion({ id: 'bodyscan', reason: t('practice.suggestBodyscan', "You've been reactive — try grounding yourself") });
      } else if (!counts['journal'] || counts['journal'] < 2) {
        setSuggestion({ id: 'journal', reason: t('practice.suggestJournal', 'A guided journal might surface new patterns') });
      } else {
        setSuggestion({ id: 'replay', reason: t('practice.suggestReplay', 'Revisit a past reflection with fresh eyes') });
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
  const [active, setActive] = useState<PracticeId | null>(null);
  const suggestion = useSuggestion(user?.id);
  const weeklyCount = useWeeklyProgress(user?.id);

  const handleSelect = useCallback((id: PracticeId) => {
    const practice = PRACTICES.find(p => p.id === id);
    if (!practice?.free && !subscribed) {
      toast(t('pro.featureLocked'), {
        description: t('pro.upgradeDesc'),
        action: { label: t('pro.upgradeCta'), onClick: () => startCheckout() },
        duration: 6000,
      });
      return;
    }
    setActive(id);
  }, [subscribed, startCheckout, t]);

  const handleComplete = useCallback(() => {
    setActive(null);
  }, []);

  if (active) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            {t(`practice.${active}Label`)}
          </p>
          <button
            onClick={() => setActive(null)}
            className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <AnimatePresence mode="wait">
          {active === 'checkin' && <EmotionalCheckIn onComplete={handleComplete} {...INLINE_COLORS} />}
          {active === 'journal' && <GuidedJournal onComplete={handleComplete} textColor={INLINE_COLORS.textColor} ringColor={INLINE_COLORS.ringColor} />}
          {active === 'bodyscan' && <BodyScan onComplete={handleComplete} {...INLINE_COLORS} />}
          {active === 'replay' && <ReflectionReplay onComplete={handleComplete} textColor={INLINE_COLORS.textColor} ringColor={INLINE_COLORS.ringColor} />}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Weekly progress */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
          {t('practice.intro')}
        </p>
        <span className="text-[10px] font-mono text-muted-foreground/40 shrink-0">
          {weeklyCount >= 7 ? '✓ 7' : `${weeklyCount}/7`}
        </span>
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
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-primary/15 bg-primary/[0.03] hover:bg-primary/[0.06] transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary/40 shrink-0" />
          <div className="flex-1 text-left">
            <span className="text-[10px] font-mono text-primary/50 uppercase tracking-wider">
              {t('practice.suggested', 'Suggested')}
            </span>
            <span className="block text-[11px] text-muted-foreground/60 mt-0.5">
              {suggestion.reason}
            </span>
          </div>
          <ChevronRight className="h-3 w-3 text-primary/30 shrink-0" />
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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-muted/30 group"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <div className="flex-1 text-left">
                <span className="text-xs font-mono text-foreground/70 group-hover:text-foreground transition-colors">
                  {t(p.labelKey)}
                </span>
                <span className="block text-[10px] text-muted-foreground/40 mt-0.5">
                  {t(p.descKey)}
                </span>
              </div>
              {locked ? (
                <Lock className="h-3 w-3 text-muted-foreground/30 shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
