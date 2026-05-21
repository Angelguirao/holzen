/**
 * Home manual-trigger pure helpers (cooldown math, localStorage keys, error mapping).
 * No Supabase — safe for presentation without loading pause RPC adapters.
 */
export {
  computeAutoCooldownRemainingMs,
  computeManualCooldownRemainingMs,
} from './domain/reflect/generation/compute-pause-trigger-cooldowns';
export {
  buildManualTriggerCooldownStorageKey,
  isManualTriggerBlockedByCooldown,
  parseManualTriggerCooldownFromStorageEvent,
  type ManualTriggerCooldownStorageEvent,
} from './domain/reflect/generation/manual-trigger-cooldown-flow';
export { mapManualTriggerStartError } from './domain/reflect/generation/map-manual-trigger-start-error';
export {
  readManualTriggerCooldownAtMs,
  writeManualTriggerCooldownAtMs,
} from './infrastructure/manual-trigger-cooldown-storage';
