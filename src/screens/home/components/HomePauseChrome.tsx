import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pause, Timer, Lock, ArrowRight } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
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

type CooldownSnapshot = { remaining: number; readyAt: number; nextScanAt: number };

const SNAPSHOT_STORAGE_KEY = 'holzen_home_cooldown_snapshot_v1';

/**
 * Hydrate the snapshot from localStorage. Returns null when nothing valid is
 * stored, when the persisted target moments are already in the past, or when
 * the storage layer throws (private mode, quota, etc.). The freshness check
 * keeps us from rendering a stale "Ready at 09:12" hours after the fact.
 */
function readPersistedSnapshot(): CooldownSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CooldownSnapshot> | null;
    if (!parsed || typeof parsed.readyAt !== 'number' || typeof parsed.nextScanAt !== 'number' || typeof parsed.remaining !== 'number') {
      return null;
    }
    const now = Date.now();
    // If both displayed moments are already in the past, the value is stale.
    const activeTarget = parsed.remaining > 0 ? parsed.readyAt : parsed.nextScanAt;
    if (activeTarget <= now) return null;
    return { remaining: parsed.remaining, readyAt: parsed.readyAt, nextScanAt: parsed.nextScanAt };
  } catch {
    return null;
  }
}

function writePersistedSnapshot(snap: CooldownSnapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snap));
  } catch { void 0; }
}

const CRON_INTERVAL_MS = 15 * 60_000; // matches `millisecondsUntilNextQuarterHour` cadence

/**
 * Compute the wall-clock instant of the first cron check that can actually
 * act on this user. The cron itself fires every 15 minutes regardless of
 * cooldown, but ticks that land while the user is still cooling down are
 * effectively no-ops for them — so the next *meaningful* scan is the first
 * quarter-hour boundary at or after cooldown ends.
 */
function computeNextScanAt(now: number, cooldownMsRemaining: number, msUntilNextCron: number): number {
  // While idle, the next cron tick is the next meaningful scan.
  if (cooldownMsRemaining <= 0) return now + msUntilNextCron;
  // While cooling down, anchor to the cron grid: round the cooldown-end
  // moment up to the next quarter-hour boundary.
  const cooldownEndsAt = now + cooldownMsRemaining;
  const nextCronAt = now + msUntilNextCron;
  if (nextCronAt >= cooldownEndsAt) return nextCronAt;
  const gap = cooldownEndsAt - nextCronAt;
  const additionalIntervals = Math.ceil(gap / CRON_INTERVAL_MS);
  return nextCronAt + additionalIntervals * CRON_INTERVAL_MS;
}

function computeFreshSnapshot(
  cooldownRemaining: () => number,
  nextCronCheckIn: () => number,
): CooldownSnapshot {
  const rem = cooldownRemaining();
  const cron = nextCronCheckIn();
  const now = Date.now();
  return { remaining: rem, readyAt: now + rem, nextScanAt: computeNextScanAt(now, rem, cron) };
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
  //
  // The latest snapshot is mirrored to localStorage so a hard refresh hydrates
  // the same static values immediately — avoiding the brief "blink" that
  // happens when the first paint computes a slightly different target than
  // the one the user saw moments ago.
  const [snapshot, setSnapshot] = useState(() => readPersistedSnapshot() ?? computeFreshSnapshot(cooldownRemaining, nextCronCheckIn));
  // Mirror the latest snapshot into a ref so the scheduling logic can read
  // the current target without re-subscribing the effect on every commit.
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  useEffect(() => {
    let timeoutId: number | undefined;
    // Single, shared drift tolerance. Wake-up handlers and the natural
    // timeout both go through `resnapshotAndSchedule`; if it's invoked
    // *before* the displayed target moment has actually arrived (within
    // this tolerance), we skip the state update and just reschedule —
    // so the row's text never updates twice in quick succession.
    const DRIFT_TOLERANCE_MS = 750;

    const resnapshotAndSchedule = (opts?: { force?: boolean }) => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      const rem = cooldownRemaining();
      const cron = nextCronCheckIn();
      const now = Date.now();
      const target = rem > 0 ? rem : cron;
      // Only commit a new snapshot when (a) we were asked to force one
      // (cold mount / bfcache restore where the prior values may be
      // stale) or (b) the previously displayed target moment has truly
      // elapsed. Otherwise just reschedule — no re-render, no flicker.
      const previousTargetMs = snapshotRef.current
        ? (snapshotRef.current.remaining > 0 ? snapshotRef.current.readyAt : snapshotRef.current.nextScanAt) - now
        : Number.POSITIVE_INFINITY;
      const shouldCommit = opts?.force === true || previousTargetMs <= DRIFT_TOLERANCE_MS;
      if (shouldCommit) {
        const next = { remaining: rem, readyAt: now + rem, nextScanAt: computeNextScanAt(now, rem, cron) };
        snapshotRef.current = next;
        setSnapshot(next);
        writePersistedSnapshot(next);
      }
      if (target <= 0) return;
      timeoutId = window.setTimeout(() => resnapshotAndSchedule(), target + DRIFT_TOLERANCE_MS);
    };

    // First run after mount: force a commit so the row reflects the
    // freshest data from the source callbacks.
    resnapshotAndSchedule({ force: true });

    // When the app resumes from the background — tab refocus, OS sleep,
    // mobile app foreground, bfcache restore — the cached `readyAt` /
    // `nextScanAt` may now be in the past. Resnapshot immediately so the
    // widget reflects the real current target instead of a stale one.
    const onVisible = () => {
      if (document.visibilityState === 'visible') resnapshotAndSchedule({ force: true });
    };
    const onPageShow = () => resnapshotAndSchedule({ force: true });
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', onPageShow);

    // Cross-tab sync: when another tab writes a fresh snapshot, mirror it
    // here so every open instance of Home shows the same static target.
    // We trust the writer's clock — they computed `readyAt` / `nextScanAt`
    // as absolute timestamps, so importing them verbatim is correct.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SNAPSHOT_STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as Partial<CooldownSnapshot> | null;
        if (
          !parsed ||
          typeof parsed.readyAt !== 'number' ||
          typeof parsed.nextScanAt !== 'number' ||
          typeof parsed.remaining !== 'number'
        ) return;
        const next: CooldownSnapshot = {
          remaining: parsed.remaining,
          readyAt: parsed.readyAt,
          nextScanAt: parsed.nextScanAt,
        };
        snapshotRef.current = next;
        setSnapshot(next);
        // Reschedule the next natural resnapshot against the new target.
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        const target = (next.remaining > 0 ? next.readyAt : next.nextScanAt) - Date.now();
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
  }, [cooldownRemaining, nextCronCheckIn]);

  // Build the formatter once per mount. Pinning the IANA timezone + 24h
  // hour-cycle + locale here means the rendered "14:32" stays identical
  // across UI-language switches and survives DST transitions cleanly
  // (the same instant always maps to the same wall-clock string).
  const fmtClock = useMemo(() => createStableClockFormatter(), []);

  if (snapshot.remaining <= 0) {
    const nextScanClock = fmtClock(snapshot.nextScanAt);
    const nextScanAria = t('home.autoCooldown.nextScanAria', {
      time: nextScanClock,
      defaultValue:
        'Holzen reviews conditions on a quarter-hour rhythm. The next review is around {{time}}. A new automatic pause only happens when your settings and the market align — this is only the schedule.',
    });
    return (
      <div
        className="space-y-0.5 py-0.5 font-sans"
        title={t('home.nextScanIdleTitle', {
          defaultValue: 'When Holzen next checks market conditions against your settings (about every 15 minutes).',
        })}
        role="status"
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

  const readyClock = fmtClock(snapshot.readyAt);
  const cooldownAria = t('home.autoCooldown.cooldownAria', {
    hours: cooldownHours,
    time: readyClock,
    defaultValue:
      'You are in the rest period that starts when a pause is created. It is not the same timer as the Need a moment button. This rest window ends at {{time}} ({{hours}} hours from that pause).',
  });
  return (
    <div className="space-y-0.5 py-1 text-base font-sans" role="status" aria-live="polite" aria-label={cooldownAria}>
      <p className={cn(homeInWidget.metaFaint, 'uppercase tracking-wide')} aria-hidden="true">
        {t('home.autoCooldown.afterPauseKicker', { defaultValue: 'Rest window after your last pause' })}
      </p>
      <div className="flex items-center gap-2">
        <Timer className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
        <p className={cn(homeInWidget.nextScanCountdown, 'tabular-nums')} aria-hidden="true">
          {t('home.autoCooldown.cooldownReadyAt', {
            hours: cooldownHours,
            time: readyClock,
            defaultValue: '{{hours}}h rest · until {{time}}',
          })}
        </p>
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
