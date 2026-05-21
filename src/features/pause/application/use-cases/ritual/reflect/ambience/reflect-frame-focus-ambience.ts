/**
 * CI cluster anchor for ritual reflect ambience (§3 / check:architecture-alignment).
 * Web Audio bed implementation lives in domain; re-export for application-layer imports.
 * Presentation: `pause-reflect-ambience-io.ts` imports through this application anchor.
 */
export {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience';
