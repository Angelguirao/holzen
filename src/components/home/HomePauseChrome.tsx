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
  // Render absolute clock targets — "Ready at 14:32", "Next scan at 14:47" —
  // instead of a live "X min left" countdown. The widget is then completely
  // static: no per-minute re-render, no blink. We re-snapshot exactly once,
  // when the displayed target moment passes.
  const [snapshot, setSnapshot] = useState(() => {
    const rem = cooldownRemaining();
    const cron = nextCronCheckIn();
    const now = Date.now();
    return { remaining: rem, readyAt: now + rem, nextScanAt: now + cron };
  });

  useEffect(() => {
    const rem = cooldownRemaining();
    const cron = nextCronCheckIn();
    const now = Date.now();
    setSnapshot({ remaining: rem, readyAt: now + rem, nextScanAt: now + cron });
    const target = rem > 0 ? rem : cron;
    if (target <= 0) return;
    const id = window.setTimeout(() => {
      const r2 = cooldownRemaining();
      const c2 = nextCronCheckIn();
      const t2 = Date.now();
      setSnapshot({ remaining: r2, readyAt: t2 + r2, nextScanAt: t2 + c2 });
    }, target + 500);
    return () => window.clearTimeout(id);
  }, [cooldownRemaining, nextCronCheckIn]);

  const fmtClock = (ms: number) =>
    new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  if (snapshot.remaining <= 0) {
    return (
      <div
        className="flex items-center gap-2 py-1 text-base font-sans"
        title={t('nextScanIdleTitle', { defaultValue: 'Next automatic scan' })}
      >
        <p className={cn(homeInWidget.nextScanCountdown, 'tabular-nums')}>
          {t('home.nextScanAtClock', {
            time: fmtClock(snapshot.nextScanAt),
            defaultValue: 'Next scan at {{time}}',
          })}
        </p>
        <span className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1 text-base font-sans">
      <Timer className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <p className={cn(homeInWidget.nextScanCountdown, 'tabular-nums')}>
        {t('home.cooldownReadyAt', {
          hours: cooldownHours,
          time: fmtClock(snapshot.readyAt),
          defaultValue: '{{hours}}h cooldown · ready at {{time}}',
        })}
      </p>
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
