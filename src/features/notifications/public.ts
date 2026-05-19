/** Public API for notifications — types and delivery vocabulary only (no Supabase). */
export type { DeliveryChannel } from './domain/delivery-channel';
export type { NotificationsInboxRow, NotificationsInboxRowType } from './domain/inbox-row';
export { DELIVERY_CHANNELS } from './application/delivery-channels';
export type { NotificationDeliveryGateway, NotifyUserIntent } from './ports/notification-delivery';
