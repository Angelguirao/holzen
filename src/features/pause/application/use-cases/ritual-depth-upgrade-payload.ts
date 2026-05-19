/** Payload for `pause_log_step` → `ritual_depth_upgraded` (server merges `from`/`to` if omitted). */
export function ritualDepthUpgradedPayload(): Record<string, unknown> {
  return { from: 'brief', to: 'deep' };
}
