import { toast } from 'sonner';
import i18n from '@/i18n';
import { PRICING } from '@/lib/pricing';

/**
 * Single source of truth for "limit reached → buy a Flex Pack" prompts.
 *
 * Every place in the app that needs to tell the user they've hit a monthly
 * allowance and offer a top-up routes through here, so the wording, tone,
 * and call-to-action are uniform across companions, regenerate, wallpapers,
 * insights, etc. Keep this file presentation-only — no business logic.
 */

export type LimitFeature =
  | 'companion'
  | 'regenerate'
  | 'wallpaper'
  | 'insight'
  | 'free_pause';

type StartCheckout = (target: 'pro' | 'pro_plus' | 'flex_pack_s' | 'flex_pack_m') => void | Promise<void>;

function featureLabel(feature: LimitFeature): string {
  const t = i18n.t.bind(i18n);
  switch (feature) {
    case 'wallpaper':
      return t('settings.allowanceWallpapers', 'Wallpapers');
    case 'insight':
      return t('settings.allowanceInsights', 'Insights');
    case 'free_pause':
      return t('settings.allowanceFreePauses', 'Free pauses');
    case 'regenerate':
    case 'companion':
    default:
      return t('settings.allowanceCompanions', 'Companions & guidance');
  }
}

/**
 * Show the standard "limit reached" toast with a single Buy-Flex-Pack-S CTA.
 * Used by every Pro feature once the monthly bucket is empty AND no flex
 * credits remain. The action button opens Stripe checkout for the small pack.
 */
export function showLimitReachedToast(opts: {
  feature: LimitFeature;
  startCheckout: StartCheckout;
  /** Override the action label (defaults to "Buy Flex Pack S · $X.XX") */
  actionLabel?: string;
}) {
  const t = i18n.t.bind(i18n);
  const label = featureLabel(opts.feature);
  const action =
    opts.actionLabel ??
    t('limits.buyFlexPackS', {
      price: PRICING.flexPackSPrice.toFixed(2),
      count: PRICING.flexPackSCredits,
      defaultValue: 'Buy Flex Pack S · ${{price}}',
    });

  toast.message(
    t('limits.reachedTitle', '{{feature}} limit reached', { feature: label }),
    {
      description: t(
        'limits.reachedDesc',
        'Top up with {{count}} flex credits to continue this month.',
        { count: PRICING.flexPackSCredits },
      ),
      action: {
        label: action,
        onClick: () => {
          void opts.startCheckout('flex_pack_s');
        },
      },
      duration: 6000,
    },
  );
}

/**
 * Returns true when a Pro feature is blocked because both the monthly
 * allowance and the flex-credit balance are exhausted.
 */
export function isPaidLimitReached(opts: {
  remaining: number;
  flexCreditsBalance: number;
}): boolean {
  return opts.remaining <= 0 && opts.flexCreditsBalance <= 0;
}