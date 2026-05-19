import { useTranslation } from 'react-i18next';
import { AutoCooldownIndicator, NeedAMomentButton } from '@/screens/home/components/HomePauseChrome';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { cn } from '@/lib/utils';

type Props = {
  showPauseScheduling: boolean;
  autoCooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
  onNeedPause: () => void;
  manualCooldownRemaining: () => number;
  pauseLoading: boolean;
  /** Zen mode centers the stack */
  variant?: 'default' | 'zen';
};

/**
 * Empty “Your pause” stack: reassurance → optional schedule meter → manual pause CTA.
 */
export function HomePauseEmptyFlow({
  showPauseScheduling,
  autoCooldownRemaining,
  cooldownHours,
  nextCronCheckIn,
  onNeedPause,
  manualCooldownRemaining,
  pauseLoading,
  variant = 'default',
}: Props) {
  const { t } = useTranslation();
  const zen = variant === 'zen';

  return (
    <div className={cn('space-y-4', zen && 'text-center')}>
      <p className={cn(homeInWidget.bodyMuted, 'leading-relaxed', zen && 'mx-auto max-w-sm')}>
        {t('home.pauseEmpty.statusLine')}
      </p>

      {showPauseScheduling ? (
        <div
          className={cn(
            'rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5',
            zen && 'mx-auto max-w-sm text-left',
          )}
        >
          <AutoCooldownIndicator
            cooldownRemaining={autoCooldownRemaining}
            cooldownHours={cooldownHours}
            nextCronCheckIn={nextCronCheckIn}
          />
        </div>
      ) : null}

      <div className={cn('border-t border-border/40 pt-3', zen && 'mx-auto w-full max-w-sm')}>
        <div className={zen ? 'mx-auto' : undefined}>
          <NeedAMomentButton
            onTrigger={onNeedPause}
            cooldownRemaining={manualCooldownRemaining}
            loading={pauseLoading}
          />
        </div>
      </div>
    </div>
  );
}
