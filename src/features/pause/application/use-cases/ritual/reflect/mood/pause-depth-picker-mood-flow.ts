/**
 * CI cluster anchor for ritual reflect mood — depth picker ritual entry (§3 / check:architecture-alignment).
 * Pure depth-picker apply helpers live in domain; re-export for application-layer imports.
 */
export {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
} from '@/features/pause/domain/reflect/mood/apply-depth-picker-ritual-entry';
export { resolvePauseDepthContextLineParams } from '@/features/pause/domain/reflect/mood/resolve-pause-depth-context-line-params';
