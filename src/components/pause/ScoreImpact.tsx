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
        label: t('holzenScore.emotionalRegulation', 'Regulation'),
        key: 'regulation',
        direction: 'up',
        reason: t('scoreImpact.breathing', 'Breathing completed'),
      });
    } else if (data.mood && data.moodAfter && COMPOSURE[data.moodAfter] > COMPOSURE[data.mood]) {
      list.push({
        label: t('holzenScore.emotionalRegulation', 'Regulation'),
        key: 'regulation',
        direction: 'up',
        reason: t('scoreImpact.moodImproved', 'Mood shifted toward composure'),
      });
    }

    // Tolerance
    const vol = parseVolatility(data.context);
    if (vol >= 3 && (data.decision === 'held' || data.decision === 'nothing')) {
      list.push({
        label: t('holzenScore.distressTolerance', 'Tolerance'),
        key: 'tolerance',
        direction: 'up',
        reason: t('scoreImpact.heldVolatility', 'Held steady during {{vol}}% move', { vol: vol.toFixed(1) }),
      });
    }

    // Reappraisal
    if (data.engagedTools > 0) {
      list.push({
        label: t('holzenScore.cognitiveReappraisal', 'Reappraisal'),
        key: 'reappraisal',
        direction: 'up',
        reason: t('scoreImpact.tools', 'Used {{count}} perspective tool(s)', { count: data.engagedTools }),
      });
    }

    // Awareness
    if (data.wroteNote || data.usedTags) {
      list.push({
        label: t('holzenScore.selfAwareness', 'Awareness'),
        key: 'awareness',
        direction: 'up',
        reason: data.wroteNote
          ? t('scoreImpact.note', 'Added a reflection note')
          : t('scoreImpact.tags', 'Tagged this pause'),
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
      className="w-full max-w-[280px] space-y-2"
    >
      <p className="text-[9px] font-mono tracking-[0.15em] uppercase text-muted-foreground/30 text-center">
        {t('scoreImpact.title', 'Score impact')}
      </p>
      <div className="space-y-1.5">
        {impacts.map((imp) => (
          <div key={imp.key} className="flex items-center gap-2">
            {imp.direction === 'up' ? (
              <TrendingUp className="h-3 w-3 text-primary/50 shrink-0" />
            ) : (
              <Minus className="h-3 w-3 text-muted-foreground/30 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono text-foreground/50">{imp.label}</span>
              <span className="text-[10px] font-mono text-muted-foreground/30 ml-1.5">{imp.reason}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
