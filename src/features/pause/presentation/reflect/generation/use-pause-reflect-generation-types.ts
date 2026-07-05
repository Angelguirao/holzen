import type { CurrentFeelForReflect } from '@/features/pause/domain/reflect/generation/reflection-content-v2';

/** Params for holzen-reflect generation + artifact hydrate on the Reflect beat. */
export type UsePauseReflectGenerationParams = {
  pauseInstanceId: string | null;
  context: string | null;
  /** Hydrated / nav seed — when non-empty, used as-is and skips edge `holzen-reflect`. */
  initialReflectionMessage: string;
  severityAbsPct: number;
  /** This pause's Feel step (mood, intensity, tile) for structured Reflect copy. */
  currentFeel?: CurrentFeelForReflect;
  /**
   * When false, aborts in-flight work and idles. For `/pause` deep ritual, `PauseSession` passes
   * true on Reflect, Frame, second Breathe, and Decide so `holzen-reflect` can finish after the
   * Reflect card (see `docs/systems/pause-system.md` §7.1, Reflection + haiku (deep)).
   */
  enabled: boolean;
};
