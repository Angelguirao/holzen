import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/use-subscription';

/**
 * Compact credits dashboard: shows current Flex credit balance, monthly allowance
 * usage per feature, and the next reset time. Monthly allowances roll over at the
 * start of each UTC month (matches `consume_monthly_feature_quota` SQL function),
 * so we surface that as the "next eligible usage time" when a bucket is depleted.
 */
export function CreditsDashboard() {
  const { t } = useTranslation();
  const {
    loading,
    subscribed,
    tier,
    flexCreditsBalance,
    companionLimit,
    companionUsed,
    companionRemaining,
    wallpaperLimit,
    wallpaperUsed,
    wallpaperRemaining,
    insightsLimit,
    insightsUsed,
    insightsRemaining,
    monthlyUsed,
    monthlyRemaining,
  } = useSubscription();

  if (loading) {
    return (
      <p className="text-xs font-mono text-muted-foreground">
        {t('common.loading', 'Loading…')}
      </p>
    );
  }

  // Next monthly reset = first day of next UTC month
  const now = new Date();
  const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const nextResetLabel = nextReset.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  type Row = { label: string; used: number; limit: number; remaining: number };
  const rows: Row[] = subscribed
    ? [
        {
          label: t('settings.allowanceCompanions', 'Companions & guidance'),
          used: companionUsed,
          limit: companionLimit,
          remaining: companionRemaining,
        },
        {
          label: t('settings.allowanceWallpapers', 'Wallpapers'),
          used: wallpaperUsed,
          limit: wallpaperLimit,
          remaining: wallpaperRemaining,
        },
        {
          label: t('settings.allowanceInsights', 'Insights'),
          used: insightsUsed,
          limit: insightsLimit,
          remaining: insightsRemaining,
        },
      ]
    : [
        {
          label: t('settings.allowanceFreePauses', 'Free pauses'),
          used: monthlyUsed,
          limit: monthlyUsed + (monthlyRemaining ?? 0),
          remaining: monthlyRemaining ?? 0,
        },
      ];

  const anyDepleted = rows.some((r) => r.limit > 0 && r.remaining <= 0);
  const isLifetime = tier === 'lifetime';

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">
          {t('settings.creditsDashboard', 'Credits dashboard')}
        </p>
        <p className="text-xs font-mono text-muted-foreground">
          {t('settings.flexBalanceShort', 'Balance')}: <span className="text-foreground">{flexCreditsBalance}</span>
        </p>
      </div>

      <div className="rounded-md border border-border/40 divide-y divide-border/40">
        {rows.map((r) => {
          const pct = r.limit > 0 ? Math.min(100, Math.round((r.used / r.limit) * 100)) : 0;
          const depleted = r.limit > 0 && r.remaining <= 0;
          return (
            <div key={r.label} className="px-3 py-2 space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-sans text-foreground/80">{r.label}</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {r.used}/{r.limit > 0 ? r.limit : '–'}
                </span>
              </div>
              {r.limit > 0 && (
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${depleted ? 'bg-destructive' : 'bg-primary'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
              {depleted && !isLifetime && (
                <p className="text-[11px] font-mono text-muted-foreground">
                  {t('settings.nextEligibleAt', 'Next available')}: {nextResetLabel}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!isLifetime && (
        <p className="text-[11px] font-mono text-muted-foreground">
          {anyDepleted
            ? t('settings.allowanceResetsOn', 'Monthly allowances reset on {{date}}.', { date: nextResetLabel })
            : t('settings.allowanceNextReset', 'Allowances reset {{date}}.', { date: nextResetLabel })}
        </p>
      )}
    </div>
  );
}