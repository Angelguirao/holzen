import { generateReflectionAtReflectStep } from '@/features/pause/infrastructure/edge/reflect/reflection-artifact';
import { fetchHaikuTextForPauseInstance } from '@/features/pause/infrastructure/queries/reflect/haiku-artifact-query';
import { fetchReflectionTextForPauseInstance } from '@/features/pause/infrastructure/queries/reflect/reflection-text-artifact-query';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';

/** Default `ReflectGenerator` — Supabase artifact read + `holzen-reflect` via `invokeEdge`. */
export const supabaseReflectGenerator: ReflectGenerator = {
  fetchReflectionText: fetchReflectionTextForPauseInstance,
  fetchHaikuText: fetchHaikuTextForPauseInstance,
  generateReflection: async (params) => {
    const { message } = await generateReflectionAtReflectStep(params);
    return { message };
  },
};
