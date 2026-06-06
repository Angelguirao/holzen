import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { LoadingButton } from '@/components/ui/loading-button';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import {
  computeManualCooldownReadyAtMs,
} from '@/features/pause/domain/reflect/generation/compute-pause-trigger-cooldowns';
import {
  AutoCooldownIndicator,
  formatHomePauseReadyAtClock,
} from '@/screens/home/components/HomePauseChrome';
import { HomePauseWidgetPreviewLine } from '@/screens/home/components/HomePauseWidgetPreviewLine';
import { HomePauseWidgetMarketRow } from '@/screens/home/components/HomePauseWidgetMarketRow';
import {
  homePauseWidgetBodyStack,
  HomePauseWidgetDiscardLink,
  HomePauseWidgetNoxCta,
  HomePauseWidgetOpeningStack,
  HomePauseWidgetTwoToneLead,
} from '@/screens/home/components/HomePauseWidgetShared';
import type { HomePauseWidgetPreviewLine as HomePauseWidgetPreviewLineModel } from '@/features/pause/domain/home/resolve-home-pause-widget-preview-line';
import type { HomePauseMarketBlock } from '@/features/pause/domain/home/format-home-pause-market-block';
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
};

function HomePauseWidgetOpeningAndMarket({
  previewLine,
  marketBlock,
}: {
  previewLine: HomePauseWidgetPreviewLineModel | null;
  marketBlock: HomePauseMarketBlock;
}) {
  const hasMarket =
    Boolean(marketBlock.moveLine || marketBlock.sentimentLine || marketBlock.updatedAtIso);
  const hasPreview = previewLine != null && previewLine.kind !== 'none';

  if (!hasPreview && !hasMarket) return null;

  return (
    <HomePauseWidgetOpeningStack>
      {hasPreview ? <HomePauseWidgetPreviewLine previewLine={previewLine} /> : null}
      {hasPreview && hasMarket ? <p className="leading-5" aria-hidden="true">
        {'\u200b'}
      </p> : null}
      {hasMarket ? <HomePauseWidgetMarketRow block={marketBlock} /> : null}
    </HomePauseWidgetOpeningStack>
  );
}

/** State B — new pause offer (Figma 559:26757). */
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
}: OpenBodyProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className={homePauseWidgetBodyStack}>
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
      <HomePauseWidgetOpeningAndMarket previewLine={previewLine} marketBlock={marketBlock} />
      <HomePauseWidgetNoxCta label={t(ctaLabelKey)} onClick={onPauseWithThis} />
    </div>
  );
}

type EngagedProps = Pick<
  HomePauseWidgetBodyProjection,
  'previewLine' | 'marketBlock' | 'onPauseWithThis' | 'onDismissOpenPause'
>;

type InProgressProps = Pick<
  HomePauseWidgetBodyProjection,
  'onPauseWithThis' | 'onDismissOpenPause'
>;

/** State B_in_progress — open `active` pause with ritual progress (Figma 555:18858). */
export function HomePauseInProgressBody({ onPauseWithThis, onDismissOpenPause }: InProgressProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className={homePauseWidgetBodyStack}>
      <HomePauseWidgetTwoToneLead
        lead={t('home.pauseIdle.withinRangeLead', {
          defaultValue: 'The market is within your range.',
        })}
        tail={t('home.pauseInProgress.stillHere', {
          defaultValue: 'The pause you started is still here.',
        })}
      />
      <div className="flex flex-col gap-6 pb-2">
        <HomePauseWidgetNoxCta label={t('home.pauseWidget.continue')} onClick={onPauseWithThis} />
        <HomePauseWidgetDiscardLink
          label={t('home.pauseWidget.discard')}
          onClick={onDismissOpenPause}
        />
      </div>
    </div>
  );
}

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
    <div className={homePauseWidgetBodyStack}>
      <HomePauseWidgetOpeningAndMarket previewLine={previewLine} marketBlock={marketBlock} />
      <div className="flex flex-col gap-6 pb-2">
        <HomePauseWidgetNoxCta label={t('home.pauseWidget.continue')} onClick={onPauseWithThis} />
        <HomePauseWidgetDiscardLink
          label={t('home.pauseWidget.discard')}
          onClick={onDismissOpenPause}
        />
      </div>
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
    <div className={homePauseWidgetBodyStack}>
      <p className={homeInWidget.kicker}>{t('home.pauseWidget.currentPauseSection')}</p>
      <HomePauseWidgetOpeningAndMarket previewLine={previewLine} marketBlock={marketBlock} />
      <div className="flex flex-col gap-6 pb-2">
        <HomePauseWidgetNoxCta label={t('home.pauseWidget.continue')} onClick={onPauseWithThis} />
        <HomePauseWidgetDiscardLink
          label={t('home.pauseWidget.discard')}
          onClick={onDismissOpenPause}
        />
      </div>

      <div className="relative py-2 text-center">
        <span className="relative z-10 bg-card/40 px-3 text-xs uppercase tracking-wide text-muted-foreground">
          {t('home.pauseWidget.orDivider')}
        </span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-border/50" aria-hidden />
      </div>

      <p className={homeInWidget.kicker}>{t('home.pauseWidget.newContextSection')}</p>
      {pendingMarketBlock ? (
        <HomePauseWidgetOpeningAndMarket
          previewLine={pendingPreviewLine}
          marketBlock={pendingMarketBlock}
        />
      ) : pendingPreviewLine ? (
        <HomePauseWidgetPreviewLine previewLine={pendingPreviewLine} />
      ) : null}
      <button
        type="button"
        disabled={pendingOfferBusy}
        onClick={onNewContext}
        className={homeInWidget.ctaSecondary}
      >
        {t('home.pauseWidget.pauseWithNewContext')}
      </button>
      {onDeclinePendingOffer ? (
        <HomePauseWidgetDiscardLink
          label={t('pause.pendingKeepCta', { defaultValue: 'Keep current pause' })}
          onClick={onDeclinePendingOffer}
          disabled={pendingOfferBusy}
        />
      ) : null}
    </div>
  );
}

type PostPauseProps = Pick<
  HomePauseWidgetBodyProjection,
  | 'widgetMode'
  | 'onPauseWithThis'
  | 'previewLine'
  | 'marketBlock'
  | 'manualCooldownRemainingMs'
>;

/** States D / D′ / E — manual cooldown rest and new-offer variants. */
export function HomePausePostPauseBody({
  widgetMode,
  onPauseWithThis,
  previewLine,
  marketBlock,
  manualCooldownRemainingMs,
}: PostPauseProps) {
  "use memo";
  const { t } = useTranslation();
  const isE = widgetMode === 'E';
  const isD =
    widgetMode === 'D_collapsed' ||
    widgetMode === 'D_expanded' ||
    widgetMode === 'D_prime_collapsed' ||
    widgetMode === 'D_prime_expanded';

  if (isE) {
    return (
      <div className={homePauseWidgetBodyStack}>
        <p className="text-sm leading-5 tracking-wide text-muted-foreground">
          {t('home.pausePostPause.newOfferBody')}
        </p>
        <HomePauseWidgetOpeningAndMarket previewLine={previewLine} marketBlock={marketBlock} />
        <HomePauseWidgetNoxCta
          label={t('home.pauseIdle.letsPauseCta', { defaultValue: "Let's pause" })}
          onClick={onPauseWithThis}
        />
      </div>
    );
  }

  if (isD) {
    const readyAtMs = computeManualCooldownReadyAtMs(manualCooldownRemainingMs);
    const readyAtClock =
      readyAtMs != null && readyAtMs > Date.now()
        ? formatHomePauseReadyAtClock(readyAtMs)
        : null;

    if (!readyAtClock) return null;

    return (
      <div className={homePauseWidgetBodyStack}>
        <p className="text-sm leading-5 tracking-wide text-foreground">
          {t('home.pausePostPause.manualCooldownBody', {
            time: readyAtClock,
            defaultValue:
              'You can start another pause at {{time}}. If the market moves meaningfully before then, Holzen can still offer one.',
          })}
        </p>
      </div>
    );
  }

  return null;
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
    <div className={homePauseWidgetBodyStack}>
      <p className="text-sm leading-5 tracking-wide text-muted-foreground">
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

/** State A — idle, no open pause (structure: Figma 546:8975; tokens: Nox). */
export function HomePauseIdleExpandedBody(
  props: Pick<HomePauseWidgetBodyProjection, 'onNeedPause' | 'loading'>,
) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className={homePauseWidgetBodyStack}>
      <HomePauseWidgetTwoToneLead
        lead={t('home.pauseIdle.withinRangeLead', {
          defaultValue: 'The market is within your range.',
        })}
        tail={t('home.pauseIdle.withinRangeTail', {
          defaultValue: 'This is the moment to pause without urgency.',
        })}
      />
      <LoadingButton
        type="button"
        variant="default"
        onClick={props.onNeedPause}
        loading={props.loading}
        loadingText={t('home.generatingReflection')}
        className={cn(homeInWidget.ctaNoxPrimary, 'h-10 border-0 shadow-none')}
      >
        {t('home.pauseIdle.letsPauseCta', { defaultValue: "Let's pause" })}
      </LoadingButton>
    </div>
  );
}
