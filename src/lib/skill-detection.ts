/** Detect which skills a reflection exercised */

export type SkillType = 'regulation' | 'tolerance' | 'alignment' | 'reappraisal' | 'awareness';

interface ReflectionForSkills {
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

const COMPOSURE: Record<string, number> = {
  fomo: 10, greedy: 15, anxious: 20, fearful: 25,
  excited: 40, uncertain: 50, detached: 75, calm: 100,
};

function parseVolatility(context: string | null | undefined): number {
  if (!context) return 0;
  const match = context.match(/[↑↓](\d+(?:\.\d+)?)%/);
  return match ? parseFloat(match[1]) : 0;
}

export function detectSkills(r: ReflectionForSkills): SkillType[] {
  const skills: SkillType[] = [];

  // Emotional Regulation: mood shifted or breathing done
  if (r.mood && r.mood_after && COMPOSURE[r.mood] !== undefined && COMPOSURE[r.mood_after] !== undefined) {
    const before = COMPOSURE[r.mood];
    const after = COMPOSURE[r.mood_after];
    if (after > before) skills.push('regulation');
  }
  if (r.breathing_completed) {
    if (!skills.includes('regulation')) skills.push('regulation');
  }

  // Distress Tolerance: held during volatility. Legacy `nothing` rows are no
  // longer treated as held (consistent with src/lib/badges/compute.ts).
  const vol = parseVolatility(r.context);
  if (vol >= 3 && r.outcome === 'held') {
    skills.push('tolerance');
  }

  // Decision Alignment: held steady.
  if (r.outcome === 'held') {
    skills.push('alignment');
  }

  // Cognitive Reappraisal: engaged perspective tools
  if (r.zoom_out_read || r.history_read || r.signal_read || r.grounding_read) {
    skills.push('reappraisal');
  }

  // Self-Awareness: wrote notes, used tags, or favorited
  if ((r.note && r.note.length > 10) || (r.tags && r.tags.length > 0) || r.is_favorite) {
    skills.push('awareness');
  }

  return skills;
}

export const SKILL_LABELS: Record<SkillType, string> = {
  regulation: 'holzenScore.emotionalRegulation',
  tolerance: 'holzenScore.distressTolerance',
  alignment: 'holzenScore.decisionAlignment',
  reappraisal: 'holzenScore.cognitiveReappraisal',
  awareness: 'holzenScore.selfAwareness',
};

export const SKILL_COLORS: Record<SkillType, string> = {
  regulation: 'bg-nox-accent-violet/15 text-nox-accent-violet',
  tolerance: 'bg-accent/15 text-accent-foreground',
  alignment: 'bg-muted text-muted-foreground',
  reappraisal: 'bg-nox-accent-cyan/15 text-nox-accent-cyan',
  awareness: 'bg-secondary text-secondary-foreground',
};
