import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Waves, PenLine, Activity, History, Lock, X, ChevronRight } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionalCheckIn } from '@/components/practice/EmotionalCheckIn';
import { GuidedJournal } from '@/components/practice/GuidedJournal';
import { BodyScan } from '@/components/practice/BodyScan';
import { ReflectionReplay } from '@/components/practice/ReflectionReplay';

type PracticeId = 'checkin' | 'journal' | 'bodyscan' | 'replay';

const PRACTICES = [
  { id: 'checkin' as const, icon: Waves, labelKey: 'practice.checkinLabel', descKey: 'practice.checkinDesc' },
  { id: 'journal' as const, icon: PenLine, labelKey: 'practice.journalLabel', descKey: 'practice.journalDesc' },
  { id: 'bodyscan' as const, icon: Activity, labelKey: 'practice.bodyscanLabel', descKey: 'practice.bodyscanDesc' },
  { id: 'replay' as const, icon: History, labelKey: 'practice.replayLabel', descKey: 'practice.replayDesc' },
] as const;

// Neutral styling for the inline practice exercises (not immersive like Breathe)
const INLINE_COLORS = {
  textColor: 'hsl(var(--foreground) / 0.7)',
  ringColor: 'hsl(var(--border))',
  glowColor: 'hsl(var(--primary) / 0.1)',
};

export function PracticeWidget() {
  const { t } = useTranslation();
  const { subscribed, startCheckout } = useSubscription();
  const [active, setActive] = useState<PracticeId | null>(null);

  const handleSelect = useCallback((id: PracticeId) => {
    if (!subscribed) {
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
      <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
        {t('practice.intro')}
      </p>
      <div className="space-y-1.5">
        {PRACTICES.map((p) => {
          const Icon = p.icon;
          const locked = !subscribed;
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
