import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Zap, TrendingDown, Wind, Eye, Target, Sparkles, AlertTriangle, ArrowDown, ShoppingCart, Frown } from 'lucide-react';

export function LandingComparison() {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();

  const REACTION_STEPS = [
    { icon: <TrendingDown className="h-3.5 w-3.5" />, title: t('landing.reaction.01title') },
    { icon: <AlertTriangle className="h-3.5 w-3.5" />, title: t('landing.reaction.02title') },
    { icon: <Zap className="h-3.5 w-3.5" />, title: t('landing.reaction.03title') },
    { icon: <Frown className="h-3.5 w-3.5" />, title: t('landing.reaction.04title') },
  ];

  const REFLECTION_STEPS = [
    { icon: <TrendingDown className="h-3.5 w-3.5" />, title: t('landing.reflection.01title') },
    { icon: <Wind className="h-3.5 w-3.5" />, title: t('landing.reflection.02title') },
    { icon: <Eye className="h-3.5 w-3.5" />, title: t('landing.reflection.03title') },
    { icon: <Target className="h-3.5 w-3.5" />, title: t('landing.reflection.04title') },
    { icon: <Sparkles className="h-3.5 w-3.5" />, title: t('landing.reflection.05title') },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* WITHOUT HOLZEN */}
        <motion.div
          className="space-y-0"
          initial={prefersReduced ? {} : { opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-destructive/60 mb-4">
            {t('landing.reaction.label')}
          </p>
          {REACTION_STEPS.map((step, i) => (
            <div key={i} className="relative flex gap-3 pb-6 last:pb-0">
              {i < REACTION_STEPS.length - 1 && (
                <div className="absolute left-[11px] top-[28px] bottom-0 w-px bg-destructive/15" />
              )}
              <div className="relative z-10 flex-shrink-0 w-6 h-6 rounded-full border border-destructive/20 bg-destructive/5 flex items-center justify-center text-destructive/40">
                {step.icon}
              </div>
              <p className="text-xs text-muted-foreground/70 pt-1 leading-snug">{step.title}</p>
            </div>
          ))}
        </motion.div>

        {/* WITH HOLZEN */}
        <motion.div
          className="space-y-0"
          initial={prefersReduced ? {} : { opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-primary/60 mb-4">
            {t('landing.reflection.label')}
          </p>
          {REFLECTION_STEPS.map((step, i) => (
            <div key={i} className="relative flex gap-3 pb-6 last:pb-0">
              {i < REFLECTION_STEPS.length - 1 && (
                <div className="absolute left-[11px] top-[28px] bottom-0 w-px bg-primary/15" />
              )}
              <div className="relative z-10 flex-shrink-0 w-6 h-6 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-primary/50">
                {step.icon}
              </div>
              <p className="text-xs text-foreground pt-1 leading-snug">{step.title}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
