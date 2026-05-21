import { generateReflectionAtReflectStep } from '@/features/pause/infrastructure/edge/reflect/reflection-artifact';
import { fetchLatestPauseReflectStepFromSupabase } from '@/features/pause/infrastructure/queries/reflect/fetch-latest-pause-reflect-step';
import { fetchHaikuTextForPauseInstance } from '@/features/pause/infrastructure/queries/reflect/haiku-artifact-query';
import { fetchReflectionTextForPauseInstance } from '@/features/pause/infrastructure/queries/reflect/reflection-text-artifact-query';
import { loadReflectRecencyHints } from '@/features/pause/infrastructure/queries/reflect/load-reflect-recency-hints';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';

/** Default `ReflectGenerator` — Supabase artifact reads + `holzen-reflect` via `invokeEdge`. */
export const supabaseReflectGenerator: ReflectGenerator = {
  fetchReflectionText: fetchReflectionTextForPauseInstance,
  fetchHaikuText: fetchHaikuTextForPauseInstance,
  fetchLatestReflectStep: fetchLatestPauseReflectStepFromSupabase,
  loadRecencyHints: loadReflectRecencyHints,
  generateReflection: async (params) => {
    const recencyHints = await loadReflectRecencyHints();
    const { message } = await generateReflectionAtReflectStep({ ...params, recencyHints });
    return { message };
  },
};
