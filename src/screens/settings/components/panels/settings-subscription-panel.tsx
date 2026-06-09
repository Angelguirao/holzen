import { Link } from 'react-router-dom';
import { LoadingButton } from '@/components/ui/loading-button';
import { PRICING } from '@/features/subscription/public';
import { CreditsDashboard } from '@/screens/settings/components/CreditsDashboard';
import { useSettingsState } from '@/screens/settings/hooks/use-settings-state';

export function SettingsSubscriptionPanel() {
  const {
    t,
    subLoading,
    subscribed,
    tier,
    entitlement,
    trialLoading,
    ensureTrial,
    startReactivationCheckout,
    checkoutLoading,
    checkoutLoadingTarget,
    startCheckoutFromSettings,
    openPortal,
    portalLoading,
  } = useSettingsState();
  return (
    <>
      <div className="space-y-3">
        <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.plan')}</p>
        {subLoading ? (
          <p className="text-xs font-mono text-muted-foreground">{t('common.loading')}</p>
        ) : subscribed ? (
          <div className="space-y-3">
            <p className="text-sm font-sans text-foreground">
              {tier === 'pro_plus'
                ? t('settings.planProPlus', { defaultValue: 'Pro+ plan' })
                : tier === 'lifetime'
                  ? t('settings.planLifetime', { defaultValue: 'Lifetime plan' })
                  : t('settings.planPro', { defaultValue: 'Pro plan' })}
            </p>
            {tier !== 'lifetime' && (
              <div className="grid grid-cols-1 gap-2">
                <LoadingButton
                  onClick={() => startCheckoutFromSettings('flex_pack_s')}
                  loading={checkoutLoading && checkoutLoadingTarget === 'flex_pack_s'}
                  disabled={checkoutLoading && checkoutLoadingTarget !== 'flex_pack_s'}
                  loadingText={t('settings.openingCheckout')}
                  variant="outline"
                  className="w-full text-sm font-sans"
                  size="sm"
                >
                  {t('settings.flexPackSCta', {
                    count: PRICING.flexPackSCredits,
                    price: PRICING.flexPackSPrice.toFixed(2),
                    defaultValue: 'Buy Flex Pack S · ${{price}} · {{count}} credits',
                  })}
                </LoadingButton>
                <LoadingButton
                  onClick={() => startCheckoutFromSettings('flex_pack_m')}
                  loading={checkoutLoading && checkoutLoadingTarget === 'flex_pack_m'}
                  disabled={checkoutLoading && checkoutLoadingTarget !== 'flex_pack_m'}
                  loadingText={t('settings.openingCheckout')}
                  variant="outline"
                  className="w-full text-sm font-sans"
                  size="sm"
                >
                  {t('settings.flexPackMCta', {
                    count: PRICING.flexPackMCredits,
                    price: PRICING.flexPackMPrice.toFixed(2),
                    defaultValue: 'Buy Flex Pack M · ${{price}} · {{count}} credits',
                  })}
                </LoadingButton>
              </div>
            )}
            <LoadingButton
              onClick={openPortal}
              variant="outline"
              size="sm"
              className="w-full text-sm font-sans"
              loading={portalLoading}
            >
              {t('settings.manageSubscription')}
            </LoadingButton>
            <div>
              <Link to="/settings/billing-history" className="text-xs font-mono text-muted-foreground underline">
                View checkout history
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-sans text-foreground">
              {entitlement === 'lapsed'
                ? t('home.subscription.trialEnded')
                : t('home.subscription.startTrialPrompt')}
            </p>
            {entitlement === 'pre_trial' ? (
              <LoadingButton
                onClick={() => void ensureTrial()}
                loading={trialLoading}
                loadingText={t('onboarding.ready.startingTrial', { defaultValue: 'Starting trial…' })}
                className="w-full text-base font-sans"
                size="sm"
              >
                {t('home.subscription.startTrialCta')}
              </LoadingButton>
            ) : (
              <LoadingButton
                onClick={() => void startReactivationCheckout()}
                loading={checkoutLoading}
                loadingText={t('settings.openingCheckout')}
                className="w-full text-base font-sans"
                size="sm"
              >
                {t('pro.upgradeCta')}
              </LoadingButton>
            )}
          </div>
        )}
      </div>

      <CreditsDashboard />
    </>
  );
}
