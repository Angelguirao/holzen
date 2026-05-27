import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { AutoCooldownIndicator, NeedAMomentButton } from '@/screens/home/components/HomePauseChrome';
import { HomePauseWidgetPreviewLine } from '@/screens/home/components/HomePauseWidgetPreviewLine';
import { HomePauseWidgetMarketRow } from '@/screens/home/components/HomePauseWidgetMarketRow';
import type { HomePauseWidgetBodyProjection } from '@/features/pause/presentation/home/use-home-pause-widget-projection';

type OpenBodyProps = Pick<
  HomePauseWidgetBodyProjection,
  | 'previewLine'
  | 'marketBlock'
  | 'onPauseWithThis'
  | 'showPendingQueuedBanner'
  | 'pendingPreviewLine'
  | 'pendingMarketBlock'
  | 'onPauseWithNewContext'
  | 'onDeclinePendingOffer'
  | 'pendingOfferBusy'
> & {
  ctaLabelKey: string;
  showSparkle?: boolean;
};

/** State B — new pause offer. */
export function HomePauseOpenActiveBody({
  previewLine,
  marketBlock,
  onPauseWithThis,
  showPendingQueuedBanner,
  pendingPreviewLine,
  pendingMarketBlock,
  onPauseWithNewContext,
  onDeclinePendingOffer,
  pendingOfferBusy,
  ctaLabelKey,
  showSparkle = true,
}: OpenBodyProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {showPendingQueuedBanner ? (
        <div
          className="rounded-lg border border-nox-accent-mustard/35 bg-nox-accent-mustard/10 px-3 py-2.5 text-xs leading-snug text-foreground/95"
        >
          <p className="font-medium text-foreground">{t('home.pendingQueuedTitle')}</p>
          <p className="mt-1 text-foreground/85">{t('home.pendingQueuedBody')}</p>
          {pendingPreviewLine ? (
            <div className="mt-2">
              <HomePauseWidgetPreviewLine previewLine={pendingPreviewLine} />
            </div>
          ) : null}
          {pendingMarketBlock ? (
            <div className="mt-2">
              <HomePauseWidgetMarketRow block={pendingMarketBlock} />
            </div>
          ) : null}
          {onPauseWithNewContext ? (
            <button
              type="button"
              disabled={pendingOfferBusy}
              onClick={onPauseWithNewContext}
              className="mt-2 w-full rounded-lg border border-nox-accent-mustard/45 bg-background/80 px-2 py-1.5 text-center text-xs font-medium text-foreground hover:bg-background disabled:opacity-60"
            >
              {t('pause.pendingAdoptCta', { defaultValue: 'Switch to new pause' })}
            </button>
          ) : null}
          {onDeclinePendingOffer ? (
            <button
              type="button"
              disabled={pendingOfferBusy}
              onClick={onDeclinePendingOffer}
              className="mt-1 w-full py-1 text-center text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-60"
            >
              {t('pause.pendingKeepCta', { defaultValue: 'Keep current pause' })}
            </button>
          ) : null}
        </div>
      ) : null}
      <HomePauseWidgetPreviewLine previewLine={previewLine} />
      <HomePauseWidgetMarketRow block={marketBlock} />
      <button
        type="button"
        onClick={onPauseWithThis}
        className={cn(homeInWidget.ctaPrimary, 'bg-foreground text-background hover:bg-foreground/90')}
      >
        {showSparkle ? (
          <Sparkles className="h-4 w-4 shrink-0 text-background" aria-hidden />
        ) : null}
        {t(ctaLabelKey)}
      </button>
    </div>
  );
}

type EngagedProps = Pick<
  HomePauseWidgetBodyProjection,
  'previewLine' | 'marketBlock' | 'onPauseWithThis' | 'onDismissOpenPause'
>;

/** State C — reached Reflect. */
export function HomePauseEngagedBody({
  previewLine,
  marketBlock,
  onPauseWithThis,
  onDismissOpenPause,
}: EngagedProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <HomePauseWidgetPreviewLine previewLine={previewLine} />
      <HomePauseWidgetMarketRow block={marketBlock} />
      <button
        type="button"
        onClick={onPauseWithThis}
        className={cn(homeInWidget.ctaPrimary, 'bg-foreground text-background hover:bg-foreground/90')}
      >
        {t('home.pauseWidget.continue')}
      </button>
      <button
        type="button"
        onClick={onDismissOpenPause}
        className="w-full py-1 text-center text-sm font-medium text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
      >
        {t('home.pauseWidget.discard')}
      </button>
    </div>
  );
}

type PendingProps = EngagedProps &
  Pick<
    HomePauseWidgetBodyProjection,
    | 'pendingPreviewLine'
    | 'pendingMarketBlock'
    | 'onPauseWithNewContext'
    | 'onDeclinePendingOffer'
    | 'pendingOfferBusy'
  >;

/** State C′ — dual layout. */
export function HomePauseEngagedPendingBody({
  previewLine,
  marketBlock,
  pendingPreviewLine,
  pendingMarketBlock,
  onPauseWithThis,
  onDismissOpenPause,
  onPauseWithNewContext,
  onDeclinePendingOffer,
  pendingOfferBusy,
}: PendingProps) {
  "use memo";
  const { t } = useTranslation();
  const onNewContext = onPauseWithNewContext ?? onPauseWithThis;

  return (
    <div className="space-y-4">
      <p className={homeInWidget.kicker}>{t('home.pauseWidget.currentPauseSection')}</p>
      <HomePauseWidgetPreviewLine previewLine={previewLine} />
      <HomePauseWidgetMarketRow block={marketBlock} />
      <button
        type="button"
        onClick={onPauseWithThis}
        className={cn(homeInWidget.ctaPrimary, 'bg-foreground text-background hover:bg-foreground/90')}
      >
        {t('home.pauseWidget.continue')}
      </button>
      <button
        type="button"
        onClick={onDismissOpenPause}
        className="w-full py-1 text-center text-sm font-medium text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
      >
        {t('home.pauseWidget.discard')}
      </button>

      <div className="relative py-2 text-center">
        <span className="relative z-10 bg-card/40 px-3 text-xs uppercase tracking-wide text-muted-foreground">
          {t('home.pauseWidget.orDivider')}
        </span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-border/50" aria-hidden />
      </div>

      <p className={homeInWidget.kicker}>{t('home.pauseWidget.newContextSection')}</p>
      {pendingPreviewLine ? <HomePauseWidgetPreviewLine previewLine={pendingPreviewLine} /> : null}
      {pendingMarketBlock ? <HomePauseWidgetMarketRow block={pendingMarketBlock} /> : null}
      <button type="button" disabled={pendingOfferBusy} onClick={onNewContext} className={homeInWidget.ctaSecondary}>
        {t('home.pauseWidget.pauseWithNewContext')}
      </button>
      {onDeclinePendingOffer ? (
        <button
          type="button"
          disabled={pendingOfferBusy}
          onClick={onDeclinePendingOffer}
          className="w-full py-1 text-center text-sm font-medium text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground disabled:opacity-60"
        >
          {t('pause.pendingKeepCta', { defaultValue: 'Keep current pause' })}
        </button>
      ) : null}
    </div>
  );
}

type PostPauseProps = Pick<
  HomePauseWidgetBodyProjection,
  | 'widgetMode'
  | 'onPauseAgain'
  | 'showPauseScheduling'
  | 'autoCooldownRemaining'
  | 'cooldownHours'
  | 'nextCronCheckIn'
  | 'completedPauseCount'
  | 'onPauseWithThis'
  | 'previewLine'
  | 'marketBlock'
>;

/** States D / D′ / E — post-pause rest and new-offer variants. */
export function HomePausePostPauseBody({
  widgetMode,
  onPauseAgain,
  showPauseScheduling,
  autoCooldownRemaining,
  cooldownHours,
  nextCronCheckIn,
  completedPauseCount,
  onPauseWithThis,
  previewLine,
  marketBlock,
}: PostPauseProps) {
  "use memo";
  const { t } = useTranslation();
  const hasArchive = completedPauseCount > 0;
  const isE = widgetMode === 'E';

  const bodyKey =
    widgetMode === 'D_prime_collapsed' || widgetMode === 'D_prime_expanded'
      ? 'home.pausePostPause.noArchiveBody'
      : isE
        ? 'home.pausePostPause.newOfferBody'
        : 'home.pausePostPause.restBody';

  return (
    <div className="space-y-4">
      <p className={`${homeInWidget.bodyMuted} leading-relaxed`}>{t(bodyKey)}</p>

      {isE ? (
        <>
          <HomePauseWidgetPreviewLine previewLine={previewLine} />
          <HomePauseWidgetMarketRow block={marketBlock} />
          <button
            type="button"
            onClick={onPauseWithThis}
            className={cn(homeInWidget.ctaPrimary, 'bg-foreground text-background hover:bg-foreground/90')}
          >
            {t('home.pauseWidget.pauseWithThis')}
          </button>
        </>
      ) : (
        <>
          {showPauseScheduling ? (
            <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5">
              <AutoCooldownIndicator
                cooldownRemaining={autoCooldownRemaining}
                cooldownHours={cooldownHours}
                nextCronCheckIn={nextCronCheckIn}
              />
            </div>
          ) : null}
          <button type="button" onClick={onPauseAgain} className={homeInWidget.ctaPrimary}>
            {t('home.pauseWidget.pauseAgain')}
          </button>
          {hasArchive ? (
            <Link
              to="/library?tab=pauses"
              className="block w-full py-1 text-center text-sm font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {t('home.pausePostPause.revisitArchive')}
            </Link>
          ) : null}
        </>
      )}
    </div>
  );
}

type CalmProps = Pick<
  HomePauseWidgetBodyProjection,
  'showPauseScheduling' | 'autoCooldownRemaining' | 'cooldownHours' | 'nextCronCheckIn'
>;

/** Calm-waters — context_lost before user acted. */
export function HomePauseCalmWatersBody({
  showPauseScheduling,
  autoCooldownRemaining,
  cooldownHours,
  nextCronCheckIn,
}: CalmProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className={`${homeInWidget.bodyMuted} leading-relaxed`}>
        {t('home.pauseCalmWaters.body')}
      </p>
      {showPauseScheduling ? (
        <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5">
          <AutoCooldownIndicator
            cooldownRemaining={autoCooldownRemaining}
            cooldownHours={cooldownHours}
            nextCronCheckIn={nextCronCheckIn}
          />
        </div>
      ) : null}
    </div>
  );
}

/** State A′ — manual idle expanded (scheduling + Need a moment). */
export function HomePauseIdleExpandedBody(
  props: Pick<
    HomePauseWidgetBodyProjection,
    | 'showPauseScheduling'
    | 'autoCooldownRemaining'
    | 'cooldownHours'
    | 'nextCronCheckIn'
    | 'onNeedPause'
    | 'manualCooldownRemaining'
    | 'loading'
  >,
) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className={`${homeInWidget.bodyMuted} leading-relaxed`}>{t('home.pauseEmpty.statusLine')}</p>
      {props.showPauseScheduling ? (
        <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5">
          <AutoCooldownIndicator
            cooldownRemaining={props.autoCooldownRemaining}
            cooldownHours={props.cooldownHours}
            nextCronCheckIn={props.nextCronCheckIn}
          />
        </div>
      ) : null}
      <div className="border-t border-border/40 pt-3">
        <NeedAMomentButton
          onTrigger={props.onNeedPause}
          cooldownRemaining={props.manualCooldownRemaining}
          loading={props.loading}
        />
      </div>
    </div>
  );
}
