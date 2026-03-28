/**
 * InterventionSection — featured cognitive intervention at the top of the reflect step.
 *
 * Sits above the full companion list. Each type adds a framing sentence that explains
 * WHY this was surfaced before showing the content itself.
 *
 * Mirror: pure DB/template — no AI call, surfaces the user's own past session.
 * Trap:   grounding generator data + "you may be in a cognitive trap" framing.
 * Pattern: history generator data + "this has happened before" framing.
 * Question: single Gemini-generated question, no companion data.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { HistoricalInsightDisplay } from './HistoricalInsightDisplay';
import { LearningInput } from './LearningInput';
import { ZoomOutDisplay } from './ZoomOutDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanionError } from '@/components/CompanionError';

// ── Mirror Display ────────────────────────────────────────────────────────────

interface MirrorData {
  timeAgo: string;
  pastMood: string;
  pastContext: string;
  pastOutcome: string;
  message: string;
}

function MirrorDisplay({ data }: { data: MirrorData }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-[0.12em]">
        You&rsquo;ve been here before
      </p>
      <p className="text-sm font-mono text-foreground leading-relaxed">
        {data.message}
      </p>
      <div className="flex gap-4 pt-1">
        <div className="space-y-0.5">
          <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.1em]">Then</p>
          <p className="text-xs font-mono text-muted-foreground/70 capitalize">{data.pastMood}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.1em]">Decision</p>
          <p className="text-xs font-mono text-muted-foreground/70 capitalize">{data.pastOutcome}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.1em]">When</p>
          <p className="text-xs font-mono text-muted-foreground/70">{data.timeAgo}</p>
        </div>
      </div>
    </div>
  );
}

// ── Framing sentences — explain WHY this was surfaced ────────────────────────

function TrapFraming({ biasTitle }: { biasTitle?: string }) {
  return (
    <p className="text-xs font-mono text-muted-foreground/60 leading-relaxed mb-3">
      Your brain may be in a{biasTitle ? ` ${biasTitle.toLowerCase()}` : ' cognitive'} trap right now.
      Recognizing the pattern is the first step out of it.
    </p>
  );
}

function PatternFraming() {
  return (
    <p className="text-xs font-mono text-muted-foreground/60 leading-relaxed mb-3">
      This has happened before — many times. Here&rsquo;s what history actually shows.
    </p>
  );
}

// ── Section label by type ─────────────────────────────────────────────────────

const PRIMARY_LABELS: Record<string, string> = {
  mirror: 'Your Pattern',
  trap: 'What Your Brain Is Doing',
  pattern: 'Historical Context',
};

// ── Main component ────────────────────────────────────────────────────────────

interface PrimaryPayload {
  type: 'mirror' | 'pattern' | 'trap';
  data: any;
}

interface SecondaryPayload {
  type: 'zoom_out';
  data: any;
}

interface Props {
  mode: 'insight' | 'question';
  primary?: PrimaryPayload | null;
  secondary?: SecondaryPayload | null;
  question?: string | null;
  loading: boolean;
  /** Orchestrator / network failure — show retry instead of endless skeleton */
  error?: boolean;
  onRetry?: () => void;
  reflectionId?: string | null;
}

export function InterventionSection({
  mode, primary, secondary, question, loading, error = false, onRetry, reflectionId,
}: Props) {
  const [secondaryOpen, setSecondaryOpen] = useState(false);

  // ── Question Mode ──
  if (mode === 'question') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        {error && !loading ? (
          <CompanionError companionType="intervention" onRetry={onRetry} />
        ) : loading || !question ? (
          <div className="space-y-2 w-full max-w-xs">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5 mx-auto" />
          </div>
        ) : (
          <p className="text-base font-mono text-foreground/90 leading-relaxed max-w-xs">
            {question}
          </p>
        )}
        <p className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-[0.15em]">
          Sit with this before deciding
        </p>
      </motion.div>
    );
  }

  // ── Insight Mode ──
  const label = primary ? (PRIMARY_LABELS[primary.type] ?? 'Perspective') : 'Perspective';

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Primary intervention */}
      <div className="space-y-3">
        <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.15em]">
          {label}
        </p>

        {error && !loading ? (
          <CompanionError companionType="intervention" onRetry={onRetry} />
        ) : loading || !primary ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ) : (
          <>
            {primary.type === 'mirror' && (
              <MirrorDisplay data={primary.data as MirrorData} />
            )}
            {primary.type === 'pattern' && (
              <>
                <PatternFraming />
                <HistoricalInsightDisplay
                  data={primary.data}
                  loading={false}
                  error={!primary.data}
                />
              </>
            )}
            {primary.type === 'trap' && (
              <>
                <TrapFraming biasTitle={primary.data?.title} />
                <LearningInput
                  title={primary.data?.title ?? ''}
                  body={primary.data?.body ?? ''}
                  nudge={primary.data}
                  nudgeLoading={false}
                  nudgeError={!primary.data}
                  onRetry={onRetry}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Optional secondary (zoom_out) — collapsed by default */}
      {secondary && secondary.type === 'zoom_out' && secondary.data && (
        <div className="border-t border-border/20 pt-3">
          <button
            onClick={() => setSecondaryOpen((o) => !o)}
            className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors duration-300 uppercase tracking-[0.12em]"
          >
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-300 ${secondaryOpen ? 'rotate-180' : ''}`}
            />
            {secondaryOpen ? 'Less' : 'Zoom out'}
          </button>

          <AnimatePresence>
            {secondaryOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden pt-3"
              >
                <ZoomOutDisplay
                  data={secondary.data}
                  loading={false}
                  error={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
