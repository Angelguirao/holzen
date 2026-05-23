/**
 * Flex-pack limit toasts — separate from `public.ts` so checkout/tests do not eager-load i18n.
 */
export {
  classifyCompanionAccessDenied,
  type CompanionAccessDeniedReason,
} from './application/companion-access-gate';
export {
  isPaidLimitReached,
  showLimitReachedToast,
  type LimitFeature,
} from './application/limit-upsell';
