/**
 * CI cluster anchor for ritual breathe — Web Audio phase/pattern cues (§3 / check:architecture-alignment).
 * Cue helpers live in application; re-export for presentation breath I/O.
 */
export {
  playPauseBreathPatternCompleteCue,
  playPauseBreathPhaseCue,
  resumePauseAudioContext,
} from '@/features/pause/application/use-cases/ritual/breathe/ritual-audio';
