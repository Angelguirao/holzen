/**
 * Flex-pack limit toasts — separate from `public.ts` so checkout/tests do not eager-load i18n.
 */
export {
  isPaidLimitReached,
  showLimitReachedToast,
  type LimitFeature,
} from './application/limit-upsell';
