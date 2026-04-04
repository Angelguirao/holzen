import { useState, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { HaikuDisplay } from './HaikuDisplay';
import { LearningInput } from './LearningInput';
import { SignalDisplay } from './SignalDisplay';
import { ZoomOutDisplay } from './ZoomOutDisplay';
import { HistoricalInsightDisplay } from './HistoricalInsightDisplay';
import { CompanionFeedback } from './CompanionFeedback';
import { InterventionSection } from './InterventionSection';
import { Check, Heart, Lock, Feather, Anchor, BookOpenText, Mountain, Clock } from 'lucide-react';
import { useProGate } from '@/hooks/use-pro-gate';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCompanionData } from '@/hooks/use-companion-data';

export interface CompanionData {
  haiku: string | null;
  groundingTitle: string | null;
  groundingBody: string | null;
}

export interface CompanionPrefs {
  breathing: boolean;
  haiku: boolean;
  /** Ground companion card; persisted as `profiles.companion_grounding`. */
  grounding: boolean;
  signal: boolean;
  zoomOut: boolean;
  history: boolean;
}

const SEVERITY_NUMBER: Record<string, number> = { mild: 3, moderate: 6, high: 10 };

interface Props {
  companions: CompanionData;
  prefs: CompanionPrefs;
  severity?: 'mild' | 'moderate' | 'high';
  reflectionId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
  /** Current user mood — drives intervention selection */
  mood?: string | null;
}

const COMPANION_ICONS: Record<string, React.ElementType> = {
  haiku: Feather,
  grounding: Anchor,
  signal: BookOpenText,
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

export const CompanionSection = forwardRef<HTMLDivElement, Props>(function CompanionSection({ companions, prefs, severity = 'mild', reflectionId, context, reflectionMessage, mood }, ref) {
  const { isPro } = useProGate();
  const { t: i18nT } = useTranslation();

  const {
    favorites, toggleCompanionFavorite,
    completion, markCompleted,
    nudge, nudgeLoading, nudgeError, retryNudge,
    signal, signalLoading, signalError, retrySignal,
    zoomOut, zoomOutLoading, zoomOutError, retryZoomOut,
    historyInsight, historyLoading, historyError, retryHistory,
    cacheIds,
    intervention, interventionLoading, interventionError,
    retryOrchestrate,
    regenerateCompanion,
    fetchCompanion,
  } = useCompanionData({ companions, prefs, reflectionId, context, reflectionMessage, mood, severityNumber: SEVERITY_NUMBER[severity] ?? 3 });

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
  const hasGrounding = prefs.grounding;
  const hasSignal = prefs.signal && !!reflectionId;
  // Skip zoomOut companion card when intervention already shows it as secondary (avoid double-render)
  const interventionHasZoomOut = intervention?.secondary?.type === 'zoom_out';
  const hasZoomOut = prefs.zoomOut && !!reflectionId && !interventionHasZoomOut;
  const hasHistory = prefs.history && !!reflectionId;

  if (!hasHaiku && !hasGrounding && !hasSignal && !hasZoomOut && !hasHistory) return null;

  return (
    <div ref={ref} className="space-y-2.5">
      {/* Featured intervention — shown above companions when available */}
      {(intervention || interventionLoading || interventionError) && (
        <div className="mb-4">
          <InterventionSection
            mode={intervention?.mode ?? 'insight'}
            primary={intervention?.primary ?? null}
            secondary={intervention?.secondary ?? null}
            question={intervention?.question ?? null}
            loading={interventionLoading}
            error={interventionError}
            onRetry={retryOrchestrate}
            reflectionId={reflectionId}
          />
          <div className="border-t border-border/10 mt-6" />
        </div>
      )}

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

      {hasHaiku && hasSignal && (
        <p className="text-[10px] font-mono text-muted-foreground/40 text-center leading-relaxed px-1 -mt-1 mb-0.5">
          {i18nT('companions.reflectOrderHint')}
        </p>
      )}

      {hasSignal && (
        <CompanionCard
          id="signal"
          label={labels.signal}
          icon={COMPANION_ICONS.signal}
          expanded={expandedSignal}
          onToggle={() => {
            setExpandedSignal((v) => !v);
            if (!signal && !signalLoading && !signalError) fetchCompanion('signal');
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
          {signal && (
            <CompanionFeedback
              reflectionId={reflectionId}
              companionType="signal"
              cacheId={cacheIds.signal}
              regenerateSlot="signal"
              onRegenerate={() => regenerateCompanion('signal')}
              regenerating={signalLoading}
            />
          )}
        </CompanionCard>
      )}

      {hasGrounding && (
        <CompanionCard
          id="grounding"
          label={labels.ground}
          icon={COMPANION_ICONS.grounding}
          expanded={expandedLearning}
          onToggle={() => {
            setExpandedLearning((v) => !v);
            if (!nudge && !nudgeLoading && !nudgeError) fetchCompanion('grounding');
            if (!completion.grounding) markCompleted('grounding');
          }}
          completed={completion.grounding}
          loading={nudgeLoading}
          isFavorite={isPro ? favorites['grounding'] : undefined}
          onToggleFavorite={isPro ? () => toggleCompanionFavorite('grounding') : undefined}
        >
          <LearningInput
            title={companions.groundingTitle ?? ''}
            body={companions.groundingBody ?? ''}
            nudge={nudge}
            nudgeLoading={nudgeLoading}
            nudgeError={nudgeError}
            onRetry={retryNudge}
          />
          {nudge && (
            <CompanionFeedback
              reflectionId={reflectionId}
              companionType="grounding"
              cacheId={cacheIds.nudge}
              regenerateSlot="grounding"
              onRegenerate={() => regenerateCompanion('grounding')}
              regenerating={nudgeLoading}
            />
          )}
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
            if (!zoomOut && !zoomOutLoading && !zoomOutError) fetchCompanion('zoomOut');
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
          {zoomOut && (
            <CompanionFeedback
              reflectionId={reflectionId}
              companionType="zoom_out"
              cacheId={cacheIds.zoomOut}
              regenerateSlot="zoomOut"
              onRegenerate={() => regenerateCompanion('zoomOut')}
              regenerating={zoomOutLoading}
            />
          )}
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
            if (!historyInsight && !historyLoading && !historyError) fetchCompanion('history');
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
          {historyInsight && (
            <CompanionFeedback
              reflectionId={reflectionId}
              companionType="history_insight"
              cacheId={cacheIds.history}
              regenerateSlot="history"
              onRegenerate={() => regenerateCompanion('history')}
              regenerating={historyLoading}
            />
          )}
        </CompanionCard>
      )}
    </div>
  );
});
