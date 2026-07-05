import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pause, Lock, ArrowRight } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { cn } from '@/lib/utils';

/** Locale-stable HH:mm for Home pause cooldown copy (Figma D). */
export function formatHomePauseReadyAtClock(ms: number): string {
  return createStableClockFormatter()(ms);
}

/** Format ms as m:ss for short countdowns (e.g. next cron tick, manual cooldown under one minute). */
export function formatMsAsMS(ms: number): string {
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

type CronScheduleSnapshot = { nextScanAt: number };

const SNAPSHOT_STORAGE_KEY = 'holzen_home_cron_schedule_snapshot_v1';

/**
 * Hydrate the snapshot from localStorage. Returns null when nothing valid is
 * stored, when the persisted target moments are already in the past, or when
 * the storage layer throws (private mode, quota, etc.). The freshness check
 * keeps us from rendering a stale "Ready at 09:12" hours after the fact.
 */
function readPersistedSnapshot(): CronScheduleSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CronScheduleSnapshot> | null;
    if (!parsed || typeof parsed.nextScanAt !== 'number') {
      return null;
    }
    if (parsed.nextScanAt <= Date.now()) return null;
    return { nextScanAt: parsed.nextScanAt };
  } catch {
    return null;
  }
}

function writePersistedSnapshot(snap: CronScheduleSnapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snap));
  } catch { void 0; }
}

function computeFreshSnapshot(nextCronCheckIn: () => number): CronScheduleSnapshot {
  const now = Date.now();
  return { nextScanAt: now + nextCronCheckIn() };
}


export function NeedAMomentButton({
  onTrigger,
  cooldownRemaining,
  loading,
  className,
}: {
  onTrigger: () => void;
  cooldownRemaining: () => number;
  loading: boolean;
  className?: string;
}) {
  "use memo";
  const [remaining, setRemaining] = useState(() => cooldownRemaining());

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
    <div className={cn('space-y-3', className)}>
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
  "use memo";
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

/** Next hourly `check-volatility` scan — static wall-clock copy, not a live countdown. */
export function PauseCronScheduleIndicator({
  nextCronCheckIn,
}: {
  nextCronCheckIn: () => number;
}) {
  "use memo";
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState(
    () => readPersistedSnapshot() ?? computeFreshSnapshot(nextCronCheckIn),
  );
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  useEffect(() => {
    let timeoutId: number | undefined;
    const DRIFT_TOLERANCE_MS = 750;

    const resnapshotAndSchedule = (opts?: { force?: boolean }) => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      const cron = nextCronCheckIn();
      const now = Date.now();
      const previousTargetMs = snapshotRef.current.nextScanAt - now;
      const shouldCommit = opts?.force === true || previousTargetMs <= DRIFT_TOLERANCE_MS;
      if (shouldCommit) {
        const next = { nextScanAt: now + cron };
        snapshotRef.current = next;
        setSnapshot(next);
        writePersistedSnapshot(next);
      }
      if (cron <= 0) return;
      timeoutId = window.setTimeout(() => resnapshotAndSchedule(), cron + DRIFT_TOLERANCE_MS);
    };

    resnapshotAndSchedule({ force: true });

    const onVisible = () => {
      if (document.visibilityState === 'visible') resnapshotAndSchedule({ force: true });
    };
    const onPageShow = () => resnapshotAndSchedule({ force: true });
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', onPageShow);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== SNAPSHOT_STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as Partial<CronScheduleSnapshot> | null;
        if (!parsed || typeof parsed.nextScanAt !== 'number') return;
        const next: CronScheduleSnapshot = { nextScanAt: parsed.nextScanAt };
        snapshotRef.current = next;
        setSnapshot(next);
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        const target = next.nextScanAt - Date.now();
        if (target > 0) {
          timeoutId = window.setTimeout(() => resnapshotAndSchedule(), target + DRIFT_TOLERANCE_MS);
        }
      } catch { void 0; }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', onPageShow);
      window.removeEventListener('storage', onStorage);
    };
  }, [nextCronCheckIn]);

  const fmtClock = useMemo(() => createStableClockFormatter(), []);
  const nextScanClock = fmtClock(snapshot.nextScanAt);
  const nextScanAria = t('home.autoCooldown.nextScanAria', {
    time: nextScanClock,
    defaultValue:
      'Holzen reviews conditions about once an hour. The next review is around {{time}}. A new automatic pause only happens when your settings and the market align — this is only the schedule.',
  });

  return (
    <div
      className="space-y-0.5 py-0.5 font-sans"
      title={t('home.nextScanIdleTitle', {
        defaultValue: 'When Holzen next checks market conditions against your settings (about every hour).',
      })}
      aria-live="polite"
      aria-label={nextScanAria}
    >
      <p className="text-xs leading-snug text-foreground/80" aria-hidden="true">
        {t('home.autoCooldown.serverChecksKicker', { defaultValue: 'Holzen is watching the market for you' })}
      </p>
      <p className="text-xs tabular-nums leading-snug text-muted-foreground/75" aria-hidden="true">
        {t('home.autoCooldown.nextScanAtClock', {
          time: nextScanClock,
          defaultValue: 'Next routine check · {{time}}',
        })}
      </p>
    </div>
  );
}

/** @deprecated Use `PauseCronScheduleIndicator`. */
export const AutoCooldownIndicator = PauseCronScheduleIndicator;

export function ProLockedWidget({ onUpgrade, checkoutLoading, feature }: { onUpgrade: () => void; checkoutLoading: boolean; feature?: string }) {
  "use memo";
  const { t } = useTranslation();
  const descKey = feature ? `pro.desc_${feature}` : '';
  const description = feature && t(descKey) !== descKey ? t(descKey) : t('pro.upgradeDesc');
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <Lock className="h-5 w-5 text-nox-text-highlight" />
      <h2 className="font-semibold text-secondary-foreground text-base">{t('pro.featureLocked')}</h2>
      <p className="w-full text-center leading-relaxed text-muted-foreground text-base">{description}</p>
      <button
        type="button"
        onClick={onUpgrade}
        disabled={checkoutLoading}
        className="group inline-flex items-center gap-1.5 underline-offset-4 transition-colors hover:underline disabled:opacity-50 text-nox-text-link hover:text-nox-text-link/80 text-sm font-medium"
      >
        {t('pro.upgradeCta')}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
