import type {
  ReflectMoodHistoryEntry,
  ReflectRecencyHints,
} from '@/features/pause/domain/reflect/generation/reflect-recency-hints';

export type ReflectRecencyStepRow = {
  pause_instance_id: string;
  step_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export type ReflectRecencyArtifactRow = {
  kind: string;
  content: Record<string, unknown>;
};

/**
 * Pure projection from Supabase rows → edge `holzen-reflect` recency hints
 * (mirrors shapes in `pause-cron-parity` / `load-reflect-recency-hints`).
 */
export function buildReflectRecencyHintsFromRows(
  stepRows: ReflectRecencyStepRow[] | null | undefined,
  artifactRows: ReflectRecencyArtifactRow[] | null | undefined,
): ReflectRecencyHints {
  let moodHistory: ReflectMoodHistoryEntry[] | undefined;
  const byInstance = new Map<string, { mood?: string; outcome?: string; created_at?: string }>();
  for (const r of stepRows ?? []) {
    const e = byInstance.get(r.pause_instance_id) ?? {};
    if (r.step_type === 'initial_emotion_logged' && typeof r.payload?.mood === 'string') {
      e.mood = r.payload.mood as string;
      e.created_at = r.created_at;
    } else if (r.step_type === 'outcome_logged' && typeof r.payload?.outcome === 'string') {
      e.outcome = r.payload.outcome as string;
    }
    byInstance.set(r.pause_instance_id, e);
  }
  const entries = Array.from(byInstance.values()).filter((e) => e.mood);
  if (entries.length > 0) {
    moodHistory = entries
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      .map((e) => ({ mood: e.mood!, outcome: e.outcome ?? null, created_at: e.created_at }));
  }

  const msgs: string[] = [];
  const haikus: string[] = [];
  for (const a of artifactRows ?? []) {
    if (a.kind === 'reflection_text' && typeof a.content?.message === 'string') {
      msgs.push(a.content.message as string);
    } else if (a.kind === 'haiku' && typeof a.content?.haiku === 'string') {
      haikus.push(a.content.haiku as string);
    }
  }

  return {
    moodHistory,
    recentMessages: msgs.length > 0 ? msgs.slice(0, 5) : undefined,
    recentHaikus: haikus.length > 0 ? haikus.slice(0, 5) : undefined,
  };
}
