import { useState, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { HaikuDisplay } from './HaikuDisplay';
import { LearningInput } from './LearningInput';
import { SignalDisplay } from './SignalDisplay';
import { ZoomOutDisplay } from './ZoomOutDisplay';
import { HistoricalInsightDisplay } from './HistoricalInsightDisplay';
import { CompanionFeedback } from './CompanionFeedback';
import { Check, Heart, Lock, Feather, Anchor, BookOpenText, Mountain, Clock, Maximize2 } from 'lucide-react';
import { useProGate } from '@/features/subscription/public-hooks';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCompanionData } from '@/screens/pause/hooks/use-companion-data';

export type { CompanionData, CompanionPrefs } from '@/features/pause/public';
import type { CompanionData, CompanionPrefs } from '@/features/pause/public';

const SEVERITY_NUMBER: Record<string, number> = { mild: 3, moderate: 6, high: 10 };

interface Props {
  companions: CompanionData;
  prefs: CompanionPrefs;
  severity?: 'mild' | 'moderate' | 'high';
  pauseInstanceId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
  /** Current user mood — drives intervention selection */
  mood?: string | null;
  /** Overrides the small section label above companion cards (e.g. pause reflect step). */
  sectionLead?: string | null;
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
        <span className="flex-1 text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-nox-text-highlight/75">{t('pro.badge')}</span>
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
            <Check className="h-3.5 w-3.5 text-nox-accent-green" />
          ) : (
            <Icon className={`h-3.5 w-3.5 ${loading ? 'text-muted-foreground/30' : expanded ? 'text-nox-text-link/80' : 'text-muted-foreground/50'}`} />
          )}
        </div>
        <span className={`flex-1 text-sm font-medium ${completed ? 'text-muted-foreground/50' : 'text-foreground/80'}`}>
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

export const CompanionSection = forwardRef<HTMLDivElement, Props>(function CompanionSection(
  { companions, prefs, severity = 'mild', pauseInstanceId, context, reflectionMessage, mood, sectionLead },
  ref,
) {
  const { isPro } = useProGate();
  const { t: i18nT } = useTranslation();
  const navigate = useNavigate();

  const {
    favorites, toggleCompanionFavorite,
    completion, markCompleted,
    nudge, nudgeLoading, nudgeError, retryNudge,
    signal, signalLoading, signalError, retrySignal,
    zoomOut, zoomOutLoading, zoomOutError, retryZoomOut,
    historyInsight, historyLoading, historyError, retryHistory,
    cacheIds,
    cacheRelaxations,
    regenerateCompanion,
    canAccessCompanion,
    fetchCompanion,
  } = useCompanionData({ companions, prefs, pauseInstanceId, context, reflectionMessage, mood, severityNumber: SEVERITY_NUMBER[severity] ?? 3 });

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
  /** Intervention still runs in `useCompanionData` for hydration/cache — not shown as its own block (less visual noise). */
  const hasGrounding = prefs.grounding;
  const hasSignal = prefs.signal && !!pauseInstanceId;
  const hasZoomOut = prefs.zoomOut && !!pauseInstanceId;
  const hasHistory = prefs.history && !!pauseInstanceId;

  if (!hasHaiku && !hasGrounding && !hasSignal && !hasZoomOut && !hasHistory) return null;

  return (
    <div ref={ref} className="space-y-2.5">
      <p className="mb-2 px-1 text-center text-xs font-medium leading-snug text-muted-foreground">
        {sectionLead ?? labels.pause}
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

      {hasSignal && (
        <CompanionCard
          id="signal"
          label={labels.signal}
          icon={COMPANION_ICONS.signal}
          expanded={expandedSignal}
          onToggle={() => {
            setExpandedSignal((v) => {
              const next = !v;
              if (next && !signal && !signalLoading && !signalError) {
                if (!canAccessCompanion()) return v;
                void fetchCompanion('signal');
              }
              return next;
            });
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
          {signal && cacheRelaxations.signal && (
            <p className="text-[10px] text-muted-foreground/55 font-mono mt-2 leading-snug px-0.5" role="status">
              {i18nT(`companions.cacheRelaxation.${cacheRelaxations.signal}`)}
            </p>
          )}
          {signal && (
            <CompanionFeedback
              pauseInstanceId={pauseInstanceId}
              companionType="signal"
              cacheId={cacheIds.signal}
              regenerateSlot="signal"
              onRegenerate={() => regenerateCompanion('signal')}
              regenerating={signalLoading}
            />
          )}
          {pauseInstanceId && (signal || signalLoading) && (
            <div className="pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() =>
                  navigate(`/companion/signal/${pauseInstanceId}`, { state: { from: 'pause' } })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border/40 bg-muted/20 py-2.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted/35"
              >
                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
                {i18nT('companions.openFullView')}
              </button>
            </div>
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
            setExpandedLearning((v) => {
              const next = !v;
              if (next && !nudge && !nudgeLoading && !nudgeError) {
                if (!canAccessCompanion()) return v;
                void fetchCompanion('grounding');
              }
              return next;
            });
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
          {nudge && cacheRelaxations.nudge && (
            <p className="text-[10px] text-muted-foreground/55 font-mono mt-2 leading-snug px-0.5" role="status">
              {i18nT(`companions.cacheRelaxation.${cacheRelaxations.nudge}`)}
            </p>
          )}
          {nudge && (
            <CompanionFeedback
              pauseInstanceId={pauseInstanceId}
              companionType="grounding"
              cacheId={cacheIds.nudge}
              regenerateSlot="grounding"
              onRegenerate={() => regenerateCompanion('grounding')}
              regenerating={nudgeLoading}
            />
          )}
          {pauseInstanceId && (nudge || nudgeLoading) && (
            <div className="pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() =>
                  navigate(`/companion/grounding/${pauseInstanceId}`, { state: { from: 'pause' } })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border/40 bg-muted/20 py-2.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted/35"
              >
                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
                {i18nT('companions.openFullView')}
              </button>
            </div>
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
            setExpandedZoomOut((v) => {
              const next = !v;
              if (next && !zoomOut && !zoomOutLoading && !zoomOutError) {
                if (!canAccessCompanion()) return v;
                void fetchCompanion('zoomOut');
              }
              return next;
            });
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
          {zoomOut && cacheRelaxations.zoomOut && (
            <p className="text-[10px] text-muted-foreground/55 font-mono mt-2 leading-snug px-0.5" role="status">
              {i18nT(`companions.cacheRelaxation.${cacheRelaxations.zoomOut}`)}
            </p>
          )}
          {zoomOut && (
            <CompanionFeedback
              pauseInstanceId={pauseInstanceId}
              companionType="zoom_out"
              cacheId={cacheIds.zoomOut}
              regenerateSlot="zoomOut"
              onRegenerate={() => regenerateCompanion('zoomOut')}
              regenerating={zoomOutLoading}
            />
          )}
          {pauseInstanceId && (zoomOut || zoomOutLoading) && (
            <div className="pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() =>
                  navigate(`/companion/zoom-out/${pauseInstanceId}`, { state: { from: 'pause' } })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border/40 bg-muted/20 py-2.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted/35"
              >
                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
                {i18nT('companions.openFullView')}
              </button>
            </div>
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
            setExpandedHistory((v) => {
              const next = !v;
              if (next && !historyInsight && !historyLoading && !historyError) {
                if (!canAccessCompanion()) return v;
                void fetchCompanion('history');
              }
              return next;
            });
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
          {historyInsight && cacheRelaxations.history && (
            <p className="text-[10px] text-muted-foreground/55 font-mono mt-2 leading-snug px-0.5" role="status">
              {i18nT(`companions.cacheRelaxation.${cacheRelaxations.history}`)}
            </p>
          )}
          {historyInsight && (
            <CompanionFeedback
              pauseInstanceId={pauseInstanceId}
              companionType="history_insight"
              cacheId={cacheIds.history}
              regenerateSlot="history"
              onRegenerate={() => regenerateCompanion('history')}
              regenerating={historyLoading}
            />
          )}
          {pauseInstanceId && (historyInsight || historyLoading) && (
            <div className="pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() =>
                  navigate(`/companion/history/${pauseInstanceId}`, { state: { from: 'pause' } })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border/40 bg-muted/20 py-2.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted/35"
              >
                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
                {i18nT('companions.openFullView')}
              </button>
            </div>
          )}
        </CompanionCard>
      )}
    </div>
  );
});
