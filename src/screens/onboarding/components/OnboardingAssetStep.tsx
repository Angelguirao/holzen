import { motion } from 'framer-motion';
import { CheckCircle2, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TRACKED_ASSETS } from '@/features/market/public';

interface Props {
  trackedAssetId: string;
  onSelect: (value: string) => void;
  stagger: (delay: number) => object;
}

const ONBOARDING_TRACKED_ASSETS = TRACKED_ASSETS.filter((asset) => asset.id === 'bitcoin');

export function OnboardingAssetStep({ trackedAssetId, onSelect, stagger }: Props) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <motion.div className="space-y-2" {...stagger(0.1)}>
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">
          {t('onboarding.asset.kicker', { defaultValue: 'Your asset' })}
        </p>
        <div className="h-px w-8 bg-foreground/20" />
      </motion.div>

      <motion.div className="space-y-2" {...stagger(0.15)}>
        <h2 className="text-xl font-medium tracking-tight text-foreground">
          {t('onboarding.asset.title', { defaultValue: 'Pick the asset Holzen should watch first' })}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('onboarding.asset.body', {
            defaultValue:
              'Holzen starts with Bitcoin. Next you will choose how much BTC needs to move before Holzen interrupts the impulse.',
          })}
        </p>
      </motion.div>

      <motion.div className="space-y-3" {...stagger(0.25)}>
        {ONBOARDING_TRACKED_ASSETS.map((asset) => {
          const isSelected = trackedAssetId === asset.id;
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => onSelect(asset.id)}
              className={`w-full rounded-md border px-4 py-4 text-left transition-colors ${
                isSelected
                  ? 'border-foreground/30 bg-foreground/5'
                  : 'border-border/40 bg-transparent hover:border-border/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full border border-border/50 p-2">
                    <Coins className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {t(`settings.trackedAssets.${asset.id}`, { defaultValue: asset.symbol })}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t('onboarding.asset.btcBody', {
                        defaultValue:
                          'Start with BTC so Holzen can watch volatility and prepare your first pause trigger.',
                      })}
                    </p>
                  </div>
                </div>
                {isSelected ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
                ) : null}
              </div>
            </button>
          );
        })}
      </motion.div>

      <motion.p
        className="text-[10px] text-muted-foreground/50"
        {...stagger(0.4)}
      >
        {t('onboarding.asset.footer', {
          defaultValue: 'Bitcoin is the first live option.',
        })}
      </motion.p>
    </div>
  );
}
