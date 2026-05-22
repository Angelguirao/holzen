/**
 * CI cluster anchor for companion section visibility helpers (§3).
 * Sibling cluster anchor: `pause-companion-orchestration-flow` (session load / expansion / UI completion).
 * Composed by `pause-companion-frame-ui-flow`; presentation: `pause-companion-frame-ui-io` imports leaf modules directly.
 */
export {
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
  type CompanionSectionVisibility,
} from './section-visibility';
