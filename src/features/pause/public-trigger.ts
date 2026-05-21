/**
 * Home manual-trigger pure helpers (cooldown math, localStorage keys, error mapping).
 * No Supabase — safe for presentation without loading pause RPC adapters.
 */
export {
  computeAutoCooldownRemainingMs,
  computeManualCooldownRemainingMs,
} from './application/use-cases/trigger/compute-pause-trigger-cooldowns';
export {
  buildManualTriggerCooldownStorageKey,
  isManualTriggerBlockedByCooldown,
  parseManualTriggerCooldownFromStorageEvent,
  type ManualTriggerCooldownStorageEvent,
} from './application/use-cases/trigger/manual-trigger-cooldown-flow';
export { mapManualTriggerStartError } from './application/use-cases/trigger/map-manual-trigger-start-error';
export {
  readManualTriggerCooldownAtMs,
  writeManualTriggerCooldownAtMs,
} from './infrastructure/manual-trigger-cooldown-storage';
