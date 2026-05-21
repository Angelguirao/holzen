/**
 * Brief ritual pure helpers (integrate timer, navigation, brief→deep state).
 * No Supabase — safe for presentation and screens without loading pause RPC adapters.
 */
export {
  BRIEF_INTEGRATE_RING_CIRC,
  BRIEF_INTEGRATE_RING_R,
  BRIEF_INTEGRATE_SECONDS,
  briefIntegrateRemainingProgress,
  briefIntegrateRingDashOffset,
} from './application/use-cases/ritual/brief/brief-integrate-timer';
export {
  BRIEF_SWITCH_TO_DEEP_STEP,
  briefSwitchToDeepPauseState,
  type BriefSwitchToDeepPauseState,
} from './application/use-cases/ritual/brief/brief-switch-to-deep';
export {
  computeBriefPastStepClick,
  type BriefPastStepClickResult,
} from './application/use-cases/ritual/brief/brief-pause-past-step-click';
export {
  computePauseGoBackPlan,
  type PauseGoBackPlan,
} from './application/use-cases/ritual/brief/go-back-plan';
