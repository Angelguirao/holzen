import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PauseData {
  mood: string | null;
  moodAfter: string | null;
  breathingCompleted: boolean;
  decision: string | null;
  context: string | null;
  engagedTools: number; // count of perspective tools read
  wroteNote: boolean;
  usedTags: boolean;
  feelIntensity?: number | null;
  shiftIntensity?: number | null;
  reinforcementQuote?: string | null;
}

const COMPOSURE: Record<string, number> = {
  fomo: 10, greedy: 15, anxious: 20, fearful: 25,
  excited: 40, uncertain: 50, detached: 75, calm: 100,
};

function parseVolatility(context: string | null): number {
  if (!context) return 0;
  const match = context.match(/[↑↓](\d+(?:\.\d+)?)%/);
  return match ? parseFloat(match[1]) : 0;
}

interface Impact {
  label: string;
  key: string;
  direction: 'up' | 'neutral';
  reason: string;
}

export function ScoreImpact({ data }: { data: PauseData }) {
  const { t } = useTranslation();

  const impacts = useMemo(() => {
    const list: Impact[] = [];

    // Regulation
    if (data.breathingCompleted) {
      list.push({
        label: t('holzenScore.emotionalRegulation', { defaultValue: 'Regulation' }),
        key: 'regulation',
        direction: 'up',
        reason: t('scoreImpact.breathing', { defaultValue: 'Breathing completed' }),
      });
    } else if (data.mood && data.moodAfter && COMPOSURE[data.moodAfter] > COMPOSURE[data.mood]) {
      list.push({
        label: t('holzenScore.emotionalRegulation', { defaultValue: 'Regulation' }),
        key: 'regulation',
        direction: 'up',
        reason: t('scoreImpact.moodImproved', { defaultValue: 'Mood shifted toward composure' }),
      });
    }

    // Tolerance
    const vol = parseVolatility(data.context);
    if (vol >= 3 && data.decision === 'held') {
      list.push({
        label: t('holzenScore.distressTolerance', { defaultValue: 'Tolerance' }),
        key: 'tolerance',
        direction: 'up',
        reason: t('scoreImpact.heldVolatility', {
          defaultValue: 'Held steady during {{vol}}% move',
          vol: vol.toFixed(1),
        }),
      });
    }

    // Reappraisal
    if (data.engagedTools > 0) {
      list.push({
        label: t('holzenScore.cognitiveReappraisal', { defaultValue: 'Reappraisal' }),
        key: 'reappraisal',
        direction: 'up',
        reason: t('scoreImpact.tools', {
          defaultValue: 'Used {{count}} perspective tool(s)',
          count: data.engagedTools,
        }),
      });
    }

    // Awareness
    if (data.wroteNote || data.usedTags) {
      list.push({
        label: t('holzenScore.selfAwareness', { defaultValue: 'Awareness' }),
        key: 'awareness',
        direction: 'up',
        reason: data.wroteNote
          ? t('scoreImpact.note', { defaultValue: 'Added a reflection note' })
          : t('scoreImpact.tags', { defaultValue: 'Tagged this pause' }),
      });
    }

    return list;
  }, [data, t]);

  if (impacts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="w-full max-w-sm space-y-3"
    >
      <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t('scoreImpact.title', { defaultValue: 'Score impact' })}
      </p>
      <div className="space-y-2.5">
        {impacts.map((imp) => (
          <div key={imp.key} className="flex items-start gap-2.5">
            {imp.direction === 'up' ? (
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-nox-accent-green" />
            ) : (
              <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1 text-left text-sm leading-snug">
              <span className="font-medium text-foreground">{imp.label}</span>
              <span className="text-muted-foreground"> — {imp.reason}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
