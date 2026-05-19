import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { HaikuDisplay } from '@/screens/pause/components/HaikuDisplay';
import { LearningInput } from '@/screens/pause/components/LearningInput';
import { Wind, BookOpen, BookOpenText, History, Eye, Pen } from 'lucide-react';

interface Props {
  stagger: (delay: number) => object;
}

const COMPANIONS = [
  { id: 'breathing', icon: Wind, labelKey: 'onboarding.companions.breathing', descKey: 'onboarding.companions.breathingDesc' },
  { id: 'haiku', icon: Pen, labelKey: 'onboarding.companions.haiku', descKey: 'onboarding.companions.haikuDesc' },
  { id: 'grounding', icon: BookOpen, labelKey: 'onboarding.companions.grounding', descKey: 'onboarding.companions.groundingDesc' },
  { id: 'signal', icon: BookOpenText, labelKey: 'onboarding.companions.signal', descKey: 'onboarding.companions.signalDesc' },
  { id: 'zoomOut', icon: Eye, labelKey: 'onboarding.companions.zoomOut', descKey: 'onboarding.companions.zoomOutDesc' },
  { id: 'history', icon: History, labelKey: 'onboarding.companions.history', descKey: 'onboarding.companions.historyDesc' },
] as const;

/** @deprecated Not used by the onboarding flow in `Onboarding.tsx`; retained for reference or future reuse. */
export function OnboardingCompanions({ stagger }: Props) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <motion.div className="space-y-2" {...stagger(0.1)}>
        <p className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground">
          {t('onboarding.yourCompanions')}
        </p>
        <div className="h-px w-8 bg-foreground/20" />
      </motion.div>

      <motion.p
        className="text-sm text-muted-foreground leading-relaxed"
        {...stagger(0.15)}
      >
        {t('onboarding.companionIntro')}
      </motion.p>

      <motion.div className="space-y-1" {...stagger(0.25)}>
        {COMPANIONS.map((companion, i) => {
          const Icon = companion.icon;
          const isExpanded = expanded === companion.id;

          return (
            <div key={companion.id}>
              <button
                onClick={() => setExpanded(isExpanded ? null : companion.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/40 transition-colors text-left group"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground/60 transition-colors flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-foreground/80">{t(companion.labelKey)}</p>
                  <p className="text-[10px] text-muted-foreground/50 truncate">{t(companion.descKey)}</p>
                </div>
                <motion.span
                  className="text-[10px] text-muted-foreground/30 font-mono"
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  →
                </motion.span>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: prefersReduced ? 0 : 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1">
                      <CompanionPreview id={companion.id} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>

      <motion.p className="text-[10px] text-muted-foreground/40" {...stagger(0.4)}>
        {t('onboarding.toggleCompanions')}
      </motion.p>
    </div>
  );
}

function CompanionPreview({ id }: { id: string }) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();

  switch (id) {
    case 'breathing':
      return (
        <div className="flex flex-col items-center gap-2 py-3 rounded-md bg-muted/20 border border-border/30">
          <motion.div
            className="rounded-full bg-foreground/8"
            style={{ width: 40, height: 40 }}
            animate={prefersReduced ? {} : { scale: [0.6, 1, 1, 0.6] }}
            transition={{ duration: 12, repeat: Infinity, times: [0, 0.33, 0.66, 1], ease: 'easeInOut' }}
          />
          <p className="text-[10px] font-mono text-muted-foreground/60">
            {t('onboarding.inhaleHoldExhale')}
          </p>
        </div>
      );
    case 'haiku':
      return (
        <div className="rounded-md bg-muted/20 border border-border/30 p-3">
          <HaikuDisplay haiku={t('onboardingSample.haiku')} />
        </div>
      );
    case 'grounding':
      return (
        <div className="rounded-md bg-muted/20 border border-border/30 p-3">
          <LearningInput
            title={t('onboardingSample.groundingTitle')}
            body={t('onboardingSample.groundingBody')}
          />
        </div>
      );
    case 'signal':
      return (
        <div className="rounded-md bg-muted/20 border border-border/30 p-3 space-y-1">
          <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('onboarding.companions.signalSampleSource')}</p>
          <p className="text-xs leading-relaxed">{t('onboarding.companions.signalSample')}</p>
        </div>
      );
    case 'zoomOut':
      return (
        <div className="rounded-md bg-muted/20 border border-border/30 p-3 space-y-1">
          <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('onboarding.companions.zoomOutSampleLabel')}</p>
          <p className="text-xs leading-relaxed">{t('onboarding.companions.zoomOutSample')}</p>
        </div>
      );
    case 'history':
      return (
        <div className="rounded-md bg-muted/20 border border-border/30 p-3 space-y-1">
          <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('onboarding.companions.historySampleLabel')}</p>
          <p className="text-xs leading-relaxed">{t('onboarding.companions.historySample')}</p>
        </div>
      );
    default:
      return null;
  }
}
