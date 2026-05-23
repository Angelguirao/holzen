/** PostHog payload shapes for Home manual-open analytics (taxonomy: pause_instance_created, pause.manual_completed). */

export type TrackManualPauseInstanceCreatedPayload = {
  pauseInstanceId: string;
  severity: string;
  pendingOffer: boolean;
};

export type TrackPauseManualCompletedPayload = {
  durationS: number;
  hadBitcoinContext: boolean;
  trackedAssetId: string;
};
