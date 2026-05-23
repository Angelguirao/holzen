/**
 * Notifications edge mutations. Import from here in screens/app — not deep infrastructure.
 */
export {
  getRegisterPushVapidKey,
  registerPushSubscribe,
  registerPushUnsubscribe,
  type PushSubscriptionKeys,
  type RegisterPushSubscribeBody,
  type RegisterPushVapidKeyResponse,
} from './infrastructure/edge/register-push-edge';
