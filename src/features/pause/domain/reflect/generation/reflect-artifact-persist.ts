import type { ReflectionContentV2 } from '@/features/pause/domain/reflect/generation/reflection-content-v2';

/** Input for upserting `pause_ai_artifacts` after `holzen-reflect` or a silent Home reflection stub. */
export type ReflectArtifactPersistInput = {
  pauseInstanceId: string;
  userId: string;
  context: string;
  message: string;
  /** When set, persisted as schema v2 (`land`, `hypothesis`, `inquiry`, …). */
  structured?: ReflectionContentV2 | null;
  haiku?: string | null;
  groundingTitle?: string | null;
  groundingBody?: string | null;
  groundingCitation?: string | null;
  groundingUrl?: string | null;
};
