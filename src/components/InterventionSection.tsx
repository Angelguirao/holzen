/**
 * InterventionSection — renders the single cognitive intervention for a pause session.
 *
 * Replaces CompanionSection in the Reflect step. Shows ONE primary intervention
 * and an optional collapsed secondary (zoom_out). In Question Mode, shows a single
 * centered question with no companion cards.
 *
 * Reuses existing display components: HistoricalInsightDisplay, LearningInput,
 * ZoomOutDisplay. Adds MirrorDisplay for the new Mirror intervention.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { HistoricalInsightDisplay } from './HistoricalInsightDisplay';
import { LearningInput } from './LearningInput';
import { ZoomOutDisplay } from './ZoomOutDisplay';
import { Skeleton } from '@/components/ui/skeleton';

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

// ── Intervention labels ───────────────────────────────────────────────────────

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
  reflectionId?: string | null;
}

export function InterventionSection({
  mode, primary, secondary, question, loading, reflectionId,
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
        {loading || !question ? (
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

        {loading || !primary ? (
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
              <HistoricalInsightDisplay
                data={primary.data}
                loading={false}
                error={!primary.data}
              />
            )}
            {primary.type === 'trap' && (
              <LearningInput
                title={primary.data?.title ?? ''}
                body={primary.data?.body ?? ''}
                nudge={primary.data}
                nudgeLoading={false}
                nudgeError={!primary.data}
              />
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
