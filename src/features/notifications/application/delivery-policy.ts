import type { DeliveryChannel } from '../domain/delivery-channel';
import type { NotifyUserIntent } from '../ports/notification-delivery';

/** Profile fields that gate outbound channels for a pause offer (inbox always via DB trigger). */
export type PauseOfferDeliveryPrefs = {
  emailNotifications: boolean;
  /** When false, skip push even if the browser could subscribe later. */
  pushSubscribedOnDevice?: boolean;
};

/**
 * Channels that should fire for an automatic pause offer.
 * Inbox is always included — `notifications_from_pause_instances` runs on instance insert.
 */
export function channelsForPauseOffer(prefs: PauseOfferDeliveryPrefs): DeliveryChannel[] {
  const channels: DeliveryChannel[] = ['inbox'];
  if (prefs.emailNotifications) channels.push('email');
  if (prefs.pushSubscribedOnDevice) channels.push('push');
  return channels;
}

export function buildPauseOfferNotifyIntent(
  userId: string,
  pauseInstanceId: string,
  prefs: PauseOfferDeliveryPrefs,
): NotifyUserIntent {
  return {
    userId,
    kind: 'pause',
    channels: channelsForPauseOffer(prefs),
    pauseInstanceId,
  };
}
