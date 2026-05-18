/** Public API for user — export only what other features may import. */
export { isAdminFromEnvList } from './application/is-admin-env';
export type { UserSignalPreference } from './domain/user-signal-preference';
export {
  getUserSignalPreferencesQueryOptions,
  USER_SIGNAL_PREFS_QUERY_KEY,
  type UserPref,
} from './infrastructure/queries/user-signal-preferences-query';
