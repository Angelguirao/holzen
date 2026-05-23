/** Public API for notifications — types and delivery vocabulary only (no Supabase). */
export type { DeliveryChannel } from './domain/delivery-channel';
export type { NotificationsInboxRow, NotificationsInboxRowType } from './domain/inbox-row';
export { DELIVERY_CHANNELS } from './application/use-cases/delivery/delivery-channels';
export {
  buildPauseOfferNotifyIntent,
  channelsForPauseOffer,
  type PauseOfferDeliveryPrefs,
} from './application/use-cases/delivery/pause-offer-policy';
export type { NotificationDeliveryGateway, NotifyUserIntent } from './ports/notification-delivery';
