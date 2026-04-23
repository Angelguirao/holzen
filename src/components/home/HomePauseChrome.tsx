import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pause, Timer, Lock, ArrowRight } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';

/** Format ms as m:ss for short countdowns (e.g. next cron tick, manual cooldown under one minute). */
function formatMsAsMS(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format ms as a coarse "in Nm" / "<1m" label for the idle "Next scan" line.
 * Stable to the minute — lets us avoid second-level re-renders that caused a
 * subtle continuous flicker on Home.
 */
function formatMsAsMinutes(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  if (totalSec < 60) return '<1m';
  const m = Math.ceil(totalSec / 60);
  return `${m}m`;
}

export function NeedAMomentButton({
  onTrigger,
  cooldownRemaining,
  loading,
}: {
  onTrigger: () => void;
  cooldownRemaining: () => number;
  loading: boolean;
}) {
  const [remaining, setRemaining] = useState(cooldownRemaining());

  useEffect(() => {
    // Only tick while a cooldown is actually counting down. When idle
    // (remaining === 0) we don't need to re-render every second — that
    // wasted render contributed to the subtle "blink" on Home.
    // We re-check once after the cooldown elapses so the button re-enables.
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      const next = cooldownRemaining();
      setRemaining(next);
      if (next <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining, remaining]);

  const inCooldown = remaining > 0;

  return (
    <div className="space-y-3">
      <NeedAMomentButtonInner onTrigger={onTrigger} inCooldown={inCooldown} loading={loading} remainingMs={remaining} />
    </div>
  );
}

function NeedAMomentButtonInner({
  onTrigger,
  inCooldown,
  loading,
  remainingMs,
}: {
  onTrigger: () => void;
  inCooldown: boolean;
  loading: boolean;
  remainingMs: number;
}) {
  const { t } = useTranslation();
  const cooldownLabel = !inCooldown
    ? t('home.needAMoment')
    : remainingMs >= 60_000
      ? t('home.manualReflectionIn', { minutes: Math.ceil(remainingMs / 60_000) })
      : t('home.manualReflectionInSoon', { time: formatMsAsMS(remainingMs) });
  return (
    <>
      <LoadingButton
        onClick={onTrigger}
        loading={loading}
        loadingText={t('home.generatingReflection')}
        disabled={inCooldown}
        variant="outline"
        className="w-full gap-2 text-sm font-medium"
      >
        <Pause className="h-4 w-4 shrink-0" />
        {cooldownLabel}
      </LoadingButton>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        {inCooldown
          ? t('home.cooldownMessage')
          : t('home.requestAnytime')}
      </p>
    </>
  );
}

export function AutoCooldownIndicator({
  cooldownRemaining,
  cooldownHours,
  nextCronCheckIn,
}: {
  cooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
}) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(cooldownRemaining());
  const [cronIn, setCronIn] = useState(nextCronCheckIn());

  useEffect(() => {
    // Active cooldown ticks each second so the progress bar stays smooth.
    // Idle state only re-renders when the displayed minute changes, so the
    // "Next scan" line is visually stable (no per-second flicker).
    if (remaining > 0) {
      const interval = setInterval(() => {
        const rem = cooldownRemaining();
        setRemaining(rem);
        if (rem <= 0) setCronIn(nextCronCheckIn());
      }, 1000);
      return () => clearInterval(interval);
    }
    // Idle: align next tick to the next minute boundary of the cron countdown.
    let timeoutId: number | undefined;
    const scheduleNext = () => {
      const rem = cooldownRemaining();
      const cron = nextCronCheckIn();
      // Time until the displayed minute label changes (or 30s as a floor).
      const msUntilMinuteChange = cron > 0 ? ((cron - 1) % 60_000) + 1 : 30_000;
      timeoutId = window.setTimeout(() => {
        setRemaining(rem);
        setCronIn(cron);
        scheduleNext();
      }, Math.max(1_000, msUntilMinuteChange));
    };
    scheduleNext();
    return () => { if (timeoutId !== undefined) window.clearTimeout(timeoutId); };
  }, [cooldownRemaining, nextCronCheckIn, remaining]);

  if (remaining <= 0) {
    return (
      <div
        className="flex items-center gap-2 py-1 text-base font-sans"
        title={t('nextScanIdleTitle', { defaultValue: 'Next automatic scan' })}
      >
        <p className={homeInWidget.nextScanCountdown}>
          {t('home.nextScanLine', {
            scan: formatMsAsMinutes(cronIn),
            defaultValue: 'Next scan · {{scan}}',
          })}
        </p>
        {/* Static dot — the previous animate-pulse caused a subtle continuous
            "blink" against the muted background. */}
        <span className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
      </div>
    );
  }

  const totalMs = cooldownHours * 60 * 60 * 1000;
  const progress = ((totalMs - remaining) / totalMs) * 100;
  const remH = Math.floor(remaining / 3600000);
  const remM = Math.floor((remaining % 3600000) / 60000);

  const timeLabel = remH > 0
    ? `${remH}h ${remM}min`
    : `${remM}min`;

  return (
    <div className="flex items-start gap-3 py-2">
      <Timer className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className={cn(homeInWidget.kicker, 'leading-snug')}>
            {t('home.cooldownHeadline', {
              hours: cooldownHours,
              time: timeLabel,
              defaultValue: '{{hours}}h cooldown · {{time}} left',
            })}
          </p>
          <p className={cn(homeInWidget.meta, 'shrink-0 font-medium tabular-nums')}>
            {Math.round(progress)}%
          </p>
        </div>
        <div className="h-0.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-muted-foreground/40 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function ProLockedWidget({ onUpgrade, checkoutLoading, feature }: { onUpgrade: () => void; checkoutLoading: boolean; feature?: string }) {
  const { t } = useTranslation();
  const descKey = feature ? `pro.desc_${feature}` : '';
  const description = feature && t(descKey) !== descKey ? t(descKey) : t('pro.upgradeDesc');
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <Lock className="h-5 w-5 text-[#dbb266]" />
      <h2 className="font-semibold text-secondary-foreground text-base">{t('pro.featureLocked')}</h2>
      <p className="w-full text-center leading-relaxed text-muted-foreground text-base">{description}</p>
      <button
        type="button"
        onClick={onUpgrade}
        disabled={checkoutLoading}
        className="group inline-flex items-center gap-1.5 underline-offset-4 transition-colors hover:underline disabled:opacity-50 text-[#24b1c6] text-sm font-medium"
      >
        {t('pro.upgradeCta')}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
