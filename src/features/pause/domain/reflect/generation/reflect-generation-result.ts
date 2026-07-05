import type { ReflectionContentV2 } from '@/features/pause/domain/reflect/generation/reflection-content-v2';

/** Outcome of `runReflectGeneration` — hook maps to UI state via `messageFromReflectGenerationResult`. */
export type ReflectGenerationResult =
  | { status: 'seed'; message: string; content: ReflectionContentV2 }
  | { status: 'cached'; message: string; content: ReflectionContentV2 }
  | { status: 'generated'; message: string; content: ReflectionContentV2 }
  | { status: 'aborted' };
