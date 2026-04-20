import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Radar } from 'lucide-react';
import { ChartEmptyState } from './ChartEmptyState';
import { detectSkills, SKILL_LABELS, type SkillType } from '@/lib/skill-detection';
import { filterCompleted, isCompletedPause } from '@/lib/engaged-pause';

interface Reflection {
  mood?: string | null;
  mood_after?: string | null;
  outcome?: string | null;
  context?: string | null;
  breathing_completed?: boolean;
  note?: string | null;
  tags?: string[] | null;
  is_favorite?: boolean;
  zoom_out_read?: boolean;
  history_read?: boolean;
  signal_read?: boolean;
  grounding_read?: boolean;
}

interface Props {
  reflections: Reflection[];
}

const SKILL_ORDER: SkillType[] = ['regulation', 'tolerance', 'alignment', 'reappraisal', 'awareness'];

const BAR_COLORS: Record<SkillType, string> = {
  regulation: 'bg-primary',
  tolerance: 'bg-accent-foreground/60',
  alignment: 'bg-muted-foreground/50',
  reappraisal: 'bg-primary/60',
  awareness: 'bg-secondary-foreground/40',
};

export function SkillBalanceCard({ reflections }: Props) {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const completed = filterCompleted(reflections);
    if (completed.length < 3) return null;

    const counts: Record<SkillType, number> = {
      regulation: 0, tolerance: 0, alignment: 0, reappraisal: 0, awareness: 0,
    };

    for (const r of completed) {
      const skills = detectSkills(r);
      for (const s of skills) counts[s]++;
    }

    const total = completed.length;
    return SKILL_ORDER.map((skill) => ({
      skill,
      count: counts[skill],
      pct: Math.round((counts[skill] / total) * 100),
    }));
  }, [reflections]);

  if (!data) {
    const completedCount = reflections.filter(isCompletedPause).length;
    return (
      <ChartEmptyState
        title={t('skillBalance.title', 'Skill Balance')}
        message={t('skillBalance.emptyMessage', 'Complete at least 3 pauses to see which skills you practice most.')}
        current={completedCount}
        needed={3}
      />
    );
  }

  const maxPct = Math.max(...data.map((d) => d.pct), 1);
  const strongest = data.reduce((a, b) => (a.pct >= b.pct ? a : b));
  const weakest = data.reduce((a, b) => (a.pct <= b.pct ? a : b));

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Radar className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
          {t('skillBalance.title', 'Skill Balance')}
        </p>
      </div>

      <div className="space-y-2.5">
        {data.map(({ skill, count, pct }) => (
          <div key={skill} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">
                {t(SKILL_LABELS[skill])}
              </span>
              <span className="text-xs font-mono text-muted-foreground/50 tabular-nums">
                {pct}% ({count})
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(pct / maxPct) * 100}%`, backgroundColor: '#C1CBD7' }}
              />
            </div>
          </div>
        ))}
      </div>

      {strongest.pct !== weakest.pct && (
        <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
          {t('skillBalance.summary', 'Strongest: {{strong}}. Growth area: {{weak}}.', {
            strong: t(SKILL_LABELS[strongest.skill]),
            weak: t(SKILL_LABELS[weakest.skill]),
          })}
        </p>
      )}
    </div>
  );
}
