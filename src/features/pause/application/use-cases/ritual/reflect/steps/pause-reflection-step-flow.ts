/**
 * CI cluster anchor for ritual reflect steps flows (§3 / check:architecture-alignment).
 * Pure reflection_step gate lives in domain; re-export for application-layer imports.
 */
export { shouldLogPauseReflectionStep } from '@/features/pause/domain/reflect/steps/reflection-step-log';
