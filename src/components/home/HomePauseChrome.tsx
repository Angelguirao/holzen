import { useEffect, useMemo, useState } from 'react';
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
 * Resolve the timezone we should pin clock formatting to. We prefer the IANA
 * zone the browser resolves *now*, so a single Intl.DateTimeFormat instance
 * always renders the same wall-clock string for a given instant — even across
 * DST transitions (the zone, e.g. "Europe/Madrid", is stable; only the offset
 * shifts, and DateTimeFormat handles that consistently).
 */
function resolveStableTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return tz;
  } catch { void 0; }
  return 'UTC';
}

/**
 * Locale- and DST-stable HH:mm formatter. Uses 24-hour `hourCycle: 'h23'` and
 * the `en-GB` locale so the displayed glyphs ("14:32") never shift when the
 * user changes UI language; the IANA timezone is pinned per-mount so the
 * displayed hour represents the *same instant* regardless of DST changes.
 */
function createStableClockFormatter(): (ms: number) => string {
  const timeZone = resolveStableTimezone();
  const fmt = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  });
  return (ms: number) => fmt.format(new Date(ms));
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
    let timeoutId: number | undefined;

    const resnapshotAndSchedule = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      const rem = cooldownRemaining();
      const cron = nextCronCheckIn();
      const now = Date.now();
      setSnapshot({ remaining: rem, readyAt: now + rem, nextScanAt: now + cron });
      const target = rem > 0 ? rem : cron;
      if (target <= 0) return;
      timeoutId = window.setTimeout(resnapshotAndSchedule, target + 500);
    };

    resnapshotAndSchedule();

    // When the app resumes from the background — tab refocus, OS sleep,
    // mobile app foreground, bfcache restore — the cached `readyAt` /
    // `nextScanAt` may now be in the past. Resnapshot immediately so the
    // widget reflects the real current target instead of a stale one.
    const onVisible = () => {
      if (document.visibilityState === 'visible') resnapshotAndSchedule();
    };
    const onPageShow = () => resnapshotAndSchedule();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', onPageShow);

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', onPageShow);
    };
  }, [cooldownRemaining, nextCronCheckIn]);

  // Build the formatter once per mount. Pinning the IANA timezone + 24h
  // hour-cycle + locale here means the rendered "14:32" stays identical
  // across UI-language switches and survives DST transitions cleanly
  // (the same instant always maps to the same wall-clock string).
  const fmtClock = useMemo(() => createStableClockFormatter(), []);

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
