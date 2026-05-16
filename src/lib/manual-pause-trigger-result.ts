/** Result of Home "Need a moment" / `manualTrigger` (create or reuse open pause). */
export type ManualPauseTriggerResult = {
  opened: boolean;
  instanceId: string | null;
  context: string | null;
  /** When true, `instance_id` is a pending offer — do not auto-navigate to `/pause`. */
  pendingOffer?: boolean;
};

export const MANUAL_PAUSE_TRIGGER_IDLE: ManualPauseTriggerResult = {
  opened: false,
  instanceId: null,
  context: null,
};
