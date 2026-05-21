import { generateReflectionAtReflectStep } from '@/features/pause/infrastructure/edge/reflect/reflection-artifact';
import { fetchReflectionTextForPauseInstance } from '@/features/pause/infrastructure/queries/reflect/reflection-text-artifact-query';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';

/** Default `ReflectGenerator` — Supabase artifact read + `holzen-reflect` via `invokeEdge`. */
export const supabaseReflectGenerator: ReflectGenerator = {
  fetchReflectionText: fetchReflectionTextForPauseInstance,
  generateReflection: async (params) => {
    const { message } = await generateReflectionAtReflectStep(params);
    return { message };
  },
};
