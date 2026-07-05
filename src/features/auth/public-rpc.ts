/**
 * Auth-context edge mutations. Import from here in screens/app — not deep infrastructure.
 */
export { deleteAccount } from './infrastructure/edge/delete-account-edge';
export {
  confirmEmailUnsubscribe,
  fetchEmailUnsubscribeLink,
  type EmailUnsubscribeConfirmResponse,
  type EmailUnsubscribeLinkResponse,
} from './infrastructure/edge/handle-email-unsubscribe-edge';
export {
  sendWelcomeTransactionalEmail,
  type SendWelcomeEmailBody,
} from './infrastructure/edge/auth-signed-in-edge';
