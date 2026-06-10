/** Public API for user — export only what other features may import (no Supabase). */
export {
  computeHoldGoalCompactHeadline,
  type HoldGoalHeadlineGoal,
} from './application/hold-goal-headline';
export type { HoldGoalProfile } from './domain/hold-goal-profile';
export type { UserSignalPreference } from './domain/user-signal-preference';
export {
  exportDataAction,
  type ExportDataActionState,
  type ExportDataFormat,
} from './presentation/settings-export-data-io';
export {
  submitFeedbackAction,
  type FeedbackActionState,
} from './presentation/settings-feedback-io';
export {
  submitTestimonialAction,
  type TestimonialActionState,
} from './presentation/home-testimonial-io';
export {
  readPostHogSessionIdForFeedback,
  trackFeedbackSubmitted,
  type FeedbackCategory,
} from './presentation/feedback-telemetry-io';
export {
  ANCHOR_MANTRA_MAX_LENGTH,
  formatMotivationLine,
  hasMinimumMotivations,
} from './domain/profile-motivations';
export { MotivationPickerGrid } from './presentation/MotivationPickerGrid';
export {
  defaultCustomSnoozeDate,
  formatSnoozePresetUntilClock,
  formatSnoozeUntilSummary,
  inferSnoozeDurationPreset,
  isSnoozeUntilValid,
  mergeSnoozeDateAndTime,
  SNOOZE_PRESET_HOURS,
  type SnoozeDurationPreset,
} from './domain/snooze-schedule';
