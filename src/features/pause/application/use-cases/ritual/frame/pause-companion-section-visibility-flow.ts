/**
 * CI cluster anchor for companion section visibility helpers (§3).
 * Sibling CI anchor: `pause-companion-orchestration-flow` (session load, expansion, favorites).
 * Composed by `pause-companion-frame-ui-flow`; presentation: `pause-companion-frame-ui-io` imports leaf modules directly.
 * Parity: `pause-companion-orchestration-section-visibility-sibling-parity.test.ts`.
 */
export {
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
  type CompanionSectionVisibility,
} from './section-visibility';
