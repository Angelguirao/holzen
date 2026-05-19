/**
 * User TanStack query modules (imports Supabase). App hooks/screens only —
 * other features should use `@/features/user/public` (no eager Supabase).
 */
export {
  getUserSignalPreferencesQueryOptions,
  USER_SIGNAL_PREFS_QUERY_KEY,
  type UserPref,
} from './infrastructure/queries/user-signal-preferences-query';
export {
  fetchProfileRowForUser,
  getProfileRowQueryOptions,
  PROFILE_QUERY_KEY,
  type ProfileRow,
} from './infrastructure/queries/profile-row-query';
export { getHoldGoalProfileQueryOptions } from './infrastructure/queries/hold-goal-profile-query';
export {
  REFERRAL_QUERY_DISABLED_USER_ID,
  REFERRAL_REWARDS_NONE_QUERY_KEY,
  REFERRAL_REWARDS_QUERY_PREFIX,
  REFERRALS_COUNT_NONE_QUERY_KEY,
  REFERRALS_COUNT_QUERY_PREFIX,
  fetchReferralRewards,
  fetchReferralsCount,
  getReferralRewardsQueryOptions,
  getReferralsCountQueryOptions,
  referralRewardsQueryKey,
  referralsCountQueryKey,
  type ReferralGrantedRewardRow,
} from './infrastructure/queries/referral-query';
export {
  getQuietWindowsQueryOptions,
  quietWindowsQueryKey,
} from './infrastructure/queries/quiet-windows-query';
export {
  SIGNAL_SOURCES_CATALOG_QUERY_KEY,
  SIGNAL_SOURCES_CATALOG_QUERY_PREFIX,
  fetchSignalSourcesCatalog,
  getSignalSourcesCatalogQueryOptions,
  type CatalogSource,
} from './infrastructure/queries/signal-sources-catalog-query';
export {
  getThresholdVolatilityEstimatorQueryOptions,
  thresholdVolatilityEstimatorQueryKey,
} from './infrastructure/queries/threshold-volatility-estimator-query';
export {
  HOLZEN_NUMBER_QUERY_KEY,
  fetchHolzenNumber,
  getHolzenNumberQueryOptions,
  type HolzenNumberData,
} from './infrastructure/queries/holzen-number-query';
