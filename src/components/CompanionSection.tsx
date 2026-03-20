import { useState, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { HaikuDisplay } from './HaikuDisplay';
import { LearningInput } from './LearningInput';
import { SignalDisplay } from './SignalDisplay';
import { ZoomOutDisplay } from './ZoomOutDisplay';
import { HistoricalInsightDisplay } from './HistoricalInsightDisplay';
import { CompanionFeedback } from './CompanionFeedback';
import { Check, Heart, Lock, Feather, Anchor, Radio, Mountain, Clock } from 'lucide-react';
import { useProGate } from '@/hooks/use-pro-gate';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCompanionData } from '@/hooks/use-companion-data';

export interface CompanionData {
  haiku: string | null;
  learningTitle: string | null;
  learningBody: string | null;
}

export interface CompanionPrefs {
  breathing: boolean;
  haiku: boolean;
  learning: boolean;
  signal: boolean;
  zoomOut: boolean;
  history: boolean;
}

interface Props {
  companions: CompanionData;
  prefs: CompanionPrefs;
  severity?: 'mild' | 'moderate' | 'high';
  reflectionId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
}

const COMPANION_ICONS: Record<string, React.ElementType> = {
  haiku: Feather,
  learning: Anchor,
  signal: Radio,
  zoomOut: Mountain,
  history: Clock,
};

function CompanionCard({
  id,
  label,
  icon: Icon,
  expanded,
  onToggle,
  completed,
  loading,
  isFavorite,
  onToggleFavorite,
  locked,
  onUpgrade,
  children,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  expanded: boolean;
  onToggle: () => void;
  completed?: boolean;
  loading?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  locked?: boolean;
  onUpgrade?: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  if (locked) {
    return (
      <button
        onClick={onUpgrade}
        className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border/10 bg-card/10 text-muted-foreground/30 hover:bg-card/20 hover:text-muted-foreground/50 transition-all duration-300 w-full text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0">
          <Lock className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-mono tracking-wide flex-1">{label}</span>
        <span className="text-[9px] uppercase tracking-wider text-primary/40 font-mono">{t('pro.badge')}</span>
      </button>
    );
  }

  return (
    <div className="space-y-0">
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border w-full text-left cursor-pointer transition-all duration-300 ${
          expanded
            ? 'border-primary/15 bg-primary/3'
            : completed
            ? 'border-border/10 bg-card/10'
            : 'border-border/10 bg-card/15 hover:bg-card/25 hover:border-border/20'
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${
          loading && !completed ? 'bg-muted/30 animate-pulse' : completed ? 'bg-primary/10' : expanded ? 'bg-primary/8' : 'bg-muted/30'
        }`}>
          {completed ? (
            <Check className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Icon className={`h-3.5 w-3.5 ${loading ? 'text-muted-foreground/30' : expanded ? 'text-primary/70' : 'text-muted-foreground/50'}`} />
          )}
        </div>
        <span className={`text-xs font-mono tracking-wide flex-1 ${completed ? 'text-muted-foreground/40' : 'text-foreground/70'}`}>
          {label}
        </span>
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={`p-1 transition-colors ${isFavorite ? 'text-destructive' : 'text-muted-foreground/20 hover:text-destructive/60'}`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1 px-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const CompanionSection = forwardRef<HTMLDivElement, Props>(function CompanionSection({ companions, prefs, severity = 'mild', reflectionId, context, reflectionMessage }, ref) {
  const { isPro } = useProGate();
  const { t: i18nT } = useTranslation();

  const {
    favorites, toggleCompanionFavorite,
    completion, markCompleted,
    nudge, nudgeLoading, nudgeError, retryNudge,
    signal, signalLoading, signalError, retrySignal,
    zoomOut, zoomOutLoading, zoomOutError, retryZoomOut,
    historyInsight, historyLoading, historyError, retryHistory,
  } = useCompanionData({ companions, prefs, reflectionId, context, reflectionMessage });

  const labels = {
    pause: i18nT('companions.pause'),
    breathe: i18nT('companions.breathe'),
    haiku: i18nT('companions.haiku'),
    ground: i18nT('companions.ground'),
    signal: i18nT('companions.signal'),
    zoomOut: i18nT('companions.zoomOut'),
    lookBack: i18nT('companions.lookBack'),
  };

  const [expandedHaiku, setExpandedHaiku] = useState(false);
  const [expandedLearning, setExpandedLearning] = useState(false);
  const [expandedSignal, setExpandedSignal] = useState(false);
  const [expandedZoomOut, setExpandedZoomOut] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(false);

  const hasHaiku = prefs.haiku && companions.haiku;
  const hasLearning = prefs.learning;
  const hasSignal = prefs.signal && !!reflectionId;
  const hasZoomOut = prefs.zoomOut && !!reflectionId;
  const hasHistory = prefs.history && !!reflectionId;

  if (!hasHaiku && !hasLearning && !hasSignal && !hasZoomOut && !hasHistory) return null;

  return (
    <div ref={ref} className="space-y-2.5">
      <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em] text-center mb-1">
        {labels.pause}
      </p>

      {hasHaiku && (
        <CompanionCard
          id="haiku"
          label={labels.haiku}
          icon={COMPANION_ICONS.haiku}
          expanded={expandedHaiku}
          onToggle={() => {
            setExpandedHaiku((v) => !v);
            if (!completion.haiku) markCompleted('haiku');
          }}
          completed={completion.haiku}
          isFavorite={isPro ? favorites['haiku'] : undefined}
          onToggleFavorite={isPro ? () => toggleCompanionFavorite('haiku') : undefined}
        >
          <HaikuDisplay haiku={companions.haiku!} />
        </CompanionCard>
      )}

      {hasLearning && (
        <CompanionCard
          id="learning"
          label={labels.ground}
          icon={COMPANION_ICONS.learning}
          expanded={expandedLearning}
          onToggle={() => {
            setExpandedLearning((v) => !v);
            if (!completion.learning) markCompleted('learning');
          }}
          completed={completion.learning}
          loading={nudgeLoading}
          isFavorite={isPro ? favorites['learning'] : undefined}
          onToggleFavorite={isPro ? () => toggleCompanionFavorite('learning') : undefined}
        >
          <LearningInput
            title={companions.learningTitle ?? ''}
            body={companions.learningBody ?? ''}
            nudge={nudge}
            nudgeLoading={nudgeLoading}
            nudgeError={nudgeError}
            onRetry={retryNudge}
          />
          {nudge && !nudgeLoading && <CompanionFeedback reflectionId={reflectionId} companionType="learning" />}
        </CompanionCard>
      )}

      {hasSignal && (
        <CompanionCard
          id="signal"
          label={labels.signal}
          icon={COMPANION_ICONS.signal}
          expanded={expandedSignal}
          onToggle={() => {
            setExpandedSignal((v) => !v);
            if (!completion.signal) markCompleted('signal');
          }}
          completed={completion.signal}
          loading={signalLoading}
          isFavorite={isPro ? favorites['signal'] : undefined}
          onToggleFavorite={isPro ? () => toggleCompanionFavorite('signal') : undefined}
        >
          <SignalDisplay
            signal={signal}
            loading={signalLoading}
            error={signalError}
            onRetry={retrySignal}
          />
          {signal && !signalLoading && <CompanionFeedback reflectionId={reflectionId} companionType="signal" />}
        </CompanionCard>
      )}

      {hasZoomOut && (
        <CompanionCard
          id="zoomOut"
          label={labels.zoomOut}
          icon={COMPANION_ICONS.zoomOut}
          expanded={expandedZoomOut}
          onToggle={() => {
            setExpandedZoomOut((v) => !v);
            if (!completion.zoomOut) markCompleted('zoomOut');
          }}
          completed={completion.zoomOut}
          loading={zoomOutLoading}
          isFavorite={isPro ? favorites['zoom_out'] : undefined}
          onToggleFavorite={isPro ? () => toggleCompanionFavorite('zoom_out') : undefined}
        >
          <ZoomOutDisplay
            data={zoomOut}
            loading={zoomOutLoading}
            error={zoomOutError}
            onRetry={retryZoomOut}
          />
        </CompanionCard>
      )}

      {hasHistory && (
        <CompanionCard
          id="history"
          label={labels.lookBack}
          icon={COMPANION_ICONS.history}
          expanded={expandedHistory}
          onToggle={() => {
            setExpandedHistory((v) => !v);
            if (!completion.history) markCompleted('history');
          }}
          completed={completion.history}
          loading={historyLoading}
          isFavorite={isPro ? favorites['history_insight'] : undefined}
          onToggleFavorite={isPro ? () => toggleCompanionFavorite('history_insight') : undefined}
        >
          <HistoricalInsightDisplay
            data={historyInsight}
            loading={historyLoading}
            error={historyError}
            onRetry={retryHistory}
          />
        </CompanionCard>
      )}
    </div>
  );
});
