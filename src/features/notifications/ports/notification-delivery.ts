import type { DeliveryChannel } from '../domain/delivery-channel';

/**
 * Port for multi-channel delivery orchestration.
 * Server producers (e.g. `check-volatility`) still own send paths today; client implements
 * inbox reads, push registration, and preference toggles via infrastructure adapters.
 */
export type NotifyUserIntent = {
  userId: string;
  /** Product event key — aligns with `notifications.type` where applicable. */
  kind: string;
  channels: DeliveryChannel[];
  pauseInstanceId?: string;
};

export interface NotificationDeliveryGateway {
  /** Future: single entry for producers instead of scattered edge + trigger logic. */
  deliver(intent: NotifyUserIntent): Promise<void>;
}
