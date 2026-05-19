import type { DeliveryChannel } from '../../../domain/delivery-channel';

/** Channels used on the shipped pause-first surface. */
export const DELIVERY_CHANNELS = ['inbox', 'push', 'email'] as const satisfies readonly DeliveryChannel[];
