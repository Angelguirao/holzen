import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown, Wind, Eye, Target, Sparkles, Heart,
  AlertTriangle, Zap, Frown,
} from 'lucide-react';

type Variant = 'side-by-side' | 'card-flip' | 'stacked';

interface Props {
  variant?: Variant;
}

export function LandingComparison({ variant = 'side-by-side' }: Props) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();

  const REACTION = [
    { icon: <TrendingDown className="h-3.5 w-3.5" />, title: t('landing.reaction.01title') },
    { icon: <AlertTriangle className="h-3.5 w-3.5" />, title: t('landing.reaction.02title') },
    { icon: <Zap className="h-3.5 w-3.5" />, title: t('landing.reaction.03title') },
    { icon: <Frown className="h-3.5 w-3.5" />, title: t('landing.reaction.04title') },
  ];

  const REFLECTION = [
    { icon: <TrendingDown className="h-3.5 w-3.5" />, title: t('landing.reflection.01title') },
    { icon: <Heart className="h-3.5 w-3.5" />, title: t('landing.reflection.02title') },
    { icon: <Wind className="h-3.5 w-3.5" />, title: t('landing.reflection.03title') },
    { icon: <Eye className="h-3.5 w-3.5" />, title: t('landing.reflection.04title') },
    { icon: <Target className="h-3.5 w-3.5" />, title: t('landing.reflection.05title') },
    { icon: <Sparkles className="h-3.5 w-3.5" />, title: t('landing.reflection.06title') },
  ];

  if (variant === 'side-by-side') return <SideBySide reaction={REACTION} reflection={REFLECTION} prefersReduced={prefersReduced} t={t} />;
  if (variant === 'card-flip') return <CardFlip reaction={REACTION} reflection={REFLECTION} prefersReduced={prefersReduced} t={t} />;
  return <Stacked reaction={REACTION} reflection={REFLECTION} prefersReduced={prefersReduced} t={t} />;
}

/* ─── Shared types ─── */
interface Step { icon: React.ReactNode; title: string }
interface VariantProps { reaction: Step[]; reflection: Step[]; prefersReduced: boolean | null; t: (key: string) => string }

/* ═══════════════════════════════════════════════
   APPROACH 1 — Side-by-side timelines
   ═══════════════════════════════════════════════ */
function SideBySide({ reaction, reflection, prefersReduced, t }: VariantProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <motion.div
        className="space-y-0"
        initial={prefersReduced ? {} : { opacity: 0, x: -12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p className="tracking-[0.15em] uppercase text-destructive/60 mb-4 text-sm font-sans">
          {t('landing.reaction.label')}
        </p>
        {reaction.map((step, i) => (
          <div key={i} className="relative flex gap-3 pb-6 last:pb-0">
            {i < reaction.length - 1 && (
              <div className="absolute left-[11px] top-[28px] bottom-0 w-px bg-destructive/15" />
            )}
            <div className="relative z-10 flex-shrink-0 w-6 h-6 rounded-full border border-destructive/20 bg-destructive/5 flex items-center justify-center text-destructive/40">
              {step.icon}
            </div>
            <p className="text-muted-foreground/70 pt-1 leading-snug text-sm">{step.title}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        className="space-y-0"
        initial={prefersReduced ? {} : { opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <p className="tracking-[0.15em] uppercase text-muted-foreground mb-4 text-sm font-sans">
          {t('landing.reflection.label')}
        </p>
        {reflection.map((step, i) => (
          <div key={i} className="relative flex gap-3 pb-6 last:pb-0">
            {i < reflection.length - 1 && (
              <div className="absolute left-[11px] top-[28px] bottom-0 w-px bg-border/60" />
            )}
            <div className="relative z-10 flex-shrink-0 w-6 h-6 rounded-full border border-border/70 bg-muted/30 flex items-center justify-center text-muted-foreground">
              {step.icon}
            </div>
            <p className="text-foreground pt-1 leading-snug text-base">{step.title}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   APPROACH 2 — Card flip (tap to toggle)
   ═══════════════════════════════════════════════ */
function CardFlip({ reaction, reflection, prefersReduced, t }: VariantProps) {
  const [showReflection, setShowReflection] = useState(false);

  const steps = showReflection ? reflection : reaction;
  const isCalm = showReflection;

  return (
    <div className="space-y-4">
      {/* Toggle tabs */}
      <div className="flex rounded-lg border border-border/50 overflow-hidden">
        <button
          onClick={() => setShowReflection(false)}
          className={`flex-1 py-2.5 text-[10px] font-mono tracking-[0.15em] uppercase transition-colors ${
            !showReflection
              ? 'bg-destructive/10 text-destructive/80 border-r border-border/50'
              : 'text-muted-foreground/50 hover:text-muted-foreground/70 border-r border-border/50'
          }`}
        >
          {t('landing.reaction.label')}
        </button>
        <button
          onClick={() => setShowReflection(true)}
          className={`flex-1 py-2.5 text-[10px] font-mono tracking-[0.15em] uppercase transition-colors ${
            showReflection
              ? 'bg-muted/40 text-foreground border-r border-border/50'
              : 'text-muted-foreground/50 hover:text-muted-foreground/70'
          }`}
        >
          {t('landing.reflection.label')}
        </button>
      </div>

      {/* Card */}
      <div className="relative rounded-xl border border-border/40 bg-card/50 p-5 min-h-[220px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={showReflection ? 'reflection' : 'reaction'}
            initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? {} : { opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-0"
          >
            {steps.map((step, i) => (
              <div key={i} className="relative flex gap-3 pb-5 last:pb-0">
                {i < steps.length - 1 && (
                  <div className={`absolute left-[11px] top-[28px] bottom-0 w-px ${isCalm ? 'bg-border/60' : 'bg-destructive/15'}`} />
                )}
                <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center ${
                  isCalm
                    ? 'border-border/70 bg-muted/30 text-muted-foreground'
                    : 'border-destructive/20 bg-destructive/5 text-destructive/40'
                }`}>
                  {step.icon}
                </div>
                <p className={`text-xs pt-1 leading-snug ${isCalm ? 'text-foreground' : 'text-muted-foreground/70'}`}>
                  {step.title}
                </p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   APPROACH 3 — Stacked contrast
   ═══════════════════════════════════════════════ */
function Stacked({ reaction, reflection, prefersReduced, t }: VariantProps) {
  return (
    <div className="space-y-6">
      {/* Reaction — crossed out / faded */}
      <motion.div
        className="relative rounded-lg border border-destructive/10 bg-destructive/[0.02] p-4"
        initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-destructive/50 mb-3">
          {t('landing.reaction.label')}
        </p>
        <div className="space-y-2.5 opacity-50">
          {reaction.map((step, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="flex-shrink-0 w-5 h-5 rounded-full border border-destructive/15 flex items-center justify-center text-destructive/30">
                {step.icon}
              </div>
              <p className="text-xs text-muted-foreground/60 line-through decoration-destructive/20">{step.title}</p>
            </div>
          ))}
        </div>
        {/* Diagonal cross-out line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <motion.div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              background: 'linear-gradient(135deg, transparent 45%, hsl(var(--destructive) / 0.06) 49%, hsl(var(--destructive) / 0.08) 51%, transparent 55%)',
            }}
            initial={prefersReduced ? {} : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Arrow separator */}
      <motion.div
        className="flex justify-center"
        initial={prefersReduced ? {} : { opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="w-8 h-8 rounded-full border border-border/60 bg-muted/30 flex items-center justify-center">
          <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </motion.div>

      {/* Reflection — bold and clear */}
      <motion.div
        className="rounded-lg border border-border/50 bg-card/40 p-4"
        initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground mb-3">
          {t('landing.reflection.label')}
        </p>
        <div className="space-y-2.5">
          {reflection.map((step, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="flex-shrink-0 w-5 h-5 rounded-full border border-border/70 bg-muted/30 flex items-center justify-center text-muted-foreground">
                {step.icon}
              </div>
              <p className="text-xs text-foreground">{step.title}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
