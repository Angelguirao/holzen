/**
 * CI cluster anchor for ritual reflect mood — depth picker ritual entry (§3 / check:architecture-alignment).
 * Pure depth-picker apply helpers live in domain; re-export for application-layer imports.
 */
export {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
} from '@/features/pause/domain/feel/apply-depth-picker-ritual-entry';
export { isPauseSessionDepthPickerActive } from '@/features/pause/domain/feel/pause-depth-picker-active';
export { resolvePauseDepthContextLineParams } from '@/features/pause/domain/feel/resolve-pause-depth-context-line-params';
