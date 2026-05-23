import { useTranslation } from 'react-i18next';
import { AutoCooldownIndicator, NeedAMomentButton } from '@/screens/home/components/HomePauseChrome';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';

type Props = {
  showPauseScheduling: boolean;
  autoCooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
  onNeedPause: () => void;
  manualCooldownRemaining: () => number;
  pauseLoading: boolean;
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
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className={`${homeInWidget.bodyMuted} leading-relaxed`}>{t('home.pauseEmpty.statusLine')}</p>

      {showPauseScheduling ? (
        <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5">
          <AutoCooldownIndicator
            cooldownRemaining={autoCooldownRemaining}
            cooldownHours={cooldownHours}
            nextCronCheckIn={nextCronCheckIn}
          />
        </div>
      ) : null}

      <div className="border-t border-border/40 pt-3">
        <NeedAMomentButton
          onTrigger={onNeedPause}
          cooldownRemaining={manualCooldownRemaining}
          loading={pauseLoading}
        />
      </div>
    </div>
  );
}
