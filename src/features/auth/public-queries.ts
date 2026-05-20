/**
 * Auth TanStack query modules (edge/Supabase I/O). Screens import this barrel only —
 * not deep `infrastructure/` paths.
 */
export {
  AUTH_EMAIL_UNSUBSCRIBE_QUERY_PREFIX,
  EMAIL_UNSUBSCRIBE_LINK_DISABLED_TOKEN,
  EMAIL_UNSUBSCRIBE_LINK_NONE_QUERY_KEY,
  EMAIL_UNSUBSCRIBE_LINK_QUERY_LEAF,
  EMAIL_UNSUBSCRIBE_LINK_QUERY_PREFIX,
  emailUnsubscribeLinkQueryKey,
  fetchEmailUnsubscribeLinkCheck,
  getEmailUnsubscribeLinkQueryOptions,
  submitEmailUnsubscribe,
  type EmailUnsubscribeLinkCheck,
} from './infrastructure/queries/email-unsubscribe-query';
