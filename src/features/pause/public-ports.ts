/**
 * Default pause port adapters (Supabase / edge). Presentation conductors inside
 * `features/pause` import from here — not from `public-queries` (query factories only).
 */
export type { ReflectGenerator } from './ports/reflect-generator';
export type { CompanionOrchestrator } from './ports/companion-orchestrator';
export type { PauseAnalyticsRepository } from './ports/pause-analytics-repository';
export { supabaseReflectGenerator } from './infrastructure/supabase-reflect-generator';
export {
  createCompanionSlotOrchestratePorts,
  supabaseCompanionOrchestrator,
} from './infrastructure/supabase-companion-orchestrator';
export { supabasePauseAnalyticsRepository } from './infrastructure/supabase-pause-analytics-repository';
