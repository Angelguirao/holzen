/**
 * User TanStack query modules (imports Supabase). App hooks/screens only —
 * other features should use `@/features/user/public` (no eager Supabase).
 */
export {
  fetchProfileRowForUser,
  getProfileRowQueryOptions,
  PROFILE_QUERY_KEY,
  type ProfileRow,
} from './infrastructure/queries/profile-row-query';
export { subscribeProfileLastContextUpdates } from './infrastructure/realtime/profile-last-context-realtime';
export { getHoldGoalProfileQueryOptions } from './infrastructure/queries/hold-goal-profile-query';
export {
  SIGNAL_SOURCES_CATALOG_QUERY_KEY,
  SIGNAL_SOURCES_CATALOG_QUERY_PREFIX,
  fetchSignalSourcesCatalog,
  getSignalSourcesCatalogQueryOptions,
  type CatalogSource,
} from './infrastructure/queries/signal-sources-catalog-query';
export {
  deleteSignalSourceRow,
  deleteSignalSourceRowsByIds,
  insertAdminSignalSource,
  setSignalSourceDemotedForLive,
  type SignalSourceAdminMutationResult,
} from './infrastructure/queries/signal-sources-admin-mutations';
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
export {
  clearProfileHoldGoal,
  fetchProfileLastTriggerAt,
  updateProfileFields,
  updateProfileHoldGoal,
  updateProfileSnoozedUntil,
  type ProfileUpdate,
  type ProfilesHoldGoalUpdate,
} from './infrastructure/queries/profile-mutations';
export { submitUserTestimonial } from './infrastructure/queries/testimonial-mutations';
export {
  fetchLandingTestimonials,
  getLandingTestimonialsQueryOptions,
  LANDING_TESTIMONIALS_QUERY_KEY,
  LANDING_TESTIMONIALS_QUERY_PARAMS,
  LANDING_TESTIMONIALS_QUERY_PREFIX,
  type LandingTestimonialRow,
} from './infrastructure/queries/landing-testimonials-query';
export {
  BLOG_POST_BY_SLUG_DISABLED_SLUG,
  BLOG_POST_BY_SLUG_NONE_QUERY_KEY,
  BLOG_POST_BY_SLUG_QUERY_PREFIX,
  BLOG_PUBLISHED_LIST_PAGE_SIZE,
  BLOG_PUBLISHED_POSTS_QUERY_PREFIX,
  blogPostBySlugQueryKey,
  blogPublishedPostsInfiniteQueryKey,
  blogPublishedPostsNextPageParam,
  fetchBlogPostBySlug,
  fetchBlogPublishedPostsPage,
  getBlogPostBySlugQueryOptions,
  getBlogPublishedPostsInfiniteQueryOptions,
  prefetchBlogPostBySlug,
  prefetchBlogPublishedFirstPage,
  type BlogPostRow,
  type BlogPublishedListRow,
} from './infrastructure/queries/blog-post-query';
