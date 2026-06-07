import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LoadingButton } from '@/components/ui/loading-button';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import {
  computeManualCooldownReadyAtMs,
} from '@/features/pause/domain/reflect/generation/compute-pause-trigger-cooldowns';
import {
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
import type { HomePauseWidgetSurface } from '@/features/pause/domain/home/home-pause-widget-surface';
import {
  homePauseWidgetSurfaceIsManualCooldownFirstPause,
  homePauseWidgetSurfaceIsManualCooldownWithArchive,
} from '@/features/pause/domain/home/home-pause-widget-surface';
import {
  formatPauseOpenMaxRemaining,
  pauseOpenMaxDeadlineMs,
} from '@/features/pause/public-session';

type OpenBodyProps = {
  previewLine: HomePauseWidgetPreviewLineModel | null;
  marketBlock: HomePauseMarketBlock;
  onPauseWithThis: () => void;
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

/** Open pause before Reflect — Let's pause CTA. */
export function HomePauseOpenActiveBody({
  previewLine,
  marketBlock,
  onPauseWithThis,
  ctaLabelKey,
}: OpenBodyProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className={homePauseWidgetBodyStack}>
      <HomePauseWidgetOpeningAndMarket previewLine={previewLine} marketBlock={marketBlock} />
      <HomePauseWidgetNoxCta label={t(ctaLabelKey)} onClick={onPauseWithThis} />
    </div>
  );
}

type EngagedProps = {
  onPauseWithThis: () => void;
  onDismissOpenPause: () => void;
};

/** Open pause after Reflect — Continue / Discard; calm market shows settled copy. */
export function HomePauseEngagedBody({
  onPauseWithThis,
  onDismissOpenPause,
  engagedPauseMarketSettled,
  openPauseOpenMaxAnchorAt,
}: EngagedProps & {
  engagedPauseMarketSettled: boolean;
  openPauseOpenMaxAnchorAt: string | null;
}) {
  "use memo";
  const { t } = useTranslation();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!engagedPauseMarketSettled || !openPauseOpenMaxAnchorAt) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [engagedPauseMarketSettled, openPauseOpenMaxAnchorAt]);

  const openMaxRemaining =
    engagedPauseMarketSettled && openPauseOpenMaxAnchorAt
      ? formatPauseOpenMaxRemaining(pauseOpenMaxDeadlineMs(openPauseOpenMaxAnchorAt), nowMs)
      : null;

  return (
    <div className={homePauseWidgetBodyStack}>
      {engagedPauseMarketSettled ? (
        <div className="space-y-1 text-sm leading-5 tracking-wide text-foreground">
          <p>
            {t('home.pauseInProgress.marketSettledLead', {
              defaultValue: 'The market that disturbed you has settled.',
            })}
          </p>
          <p>
            {t('home.pauseInProgress.marketSettledBody', {
              defaultValue: 'Your pause is still open if you want to finish.',
            })}
          </p>
          {openMaxRemaining ? (
            <p className="pt-1">
              {t('home.pauseInProgress.closesIn', {
                remaining: openMaxRemaining,
                defaultValue: 'This pause closes in {{remaining}}',
              })}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm leading-5 tracking-wide text-muted-foreground">
          {t('home.pauseInProgress.stillHere', {
            defaultValue: 'The pause you started is still here.',
          })}
        </p>
      )}
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

type PendingProps = EngagedProps & {
  pendingMarketBlock: HomePauseMarketBlock | null;
  onPauseWithNewContext?: () => void;
  pendingOfferBusy?: boolean;
};

/** Engaged open pause with a cron pending offer — adopt new context branch. */
export function HomePauseEngagedPendingBody({
  pendingMarketBlock,
  onPauseWithThis,
  onDismissOpenPause,
  onPauseWithNewContext,
  pendingOfferBusy,
}: PendingProps) {
  "use memo";
  const { t } = useTranslation();
  const onNewContext = onPauseWithNewContext ?? onPauseWithThis;

  return (
    <div className={homePauseWidgetBodyStack}>
      <p className="text-sm leading-5 tracking-wide text-muted-foreground">
        {t('home.pauseInProgress.stillHere', {
          defaultValue: 'The pause you started is still here.',
        })}
      </p>
      <div className="flex flex-col gap-6 pb-2">
        <HomePauseWidgetNoxCta label={t('home.pauseWidget.continue')} onClick={onPauseWithThis} />
        <HomePauseWidgetDiscardLink
          label={t('home.pauseWidget.discard')}
          onClick={onDismissOpenPause}
        />
      </div>

      <div className="relative py-2 text-center">
        <span className="relative z-10 bg-card/40 px-3 text-sm text-muted-foreground">
          {t('home.pauseWidget.orDivider')}
        </span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-border/50" aria-hidden />
      </div>

      <p className={homeInWidget.kicker}>
        {t('home.widget.newPauseAvailable', { defaultValue: 'New pause available' })}
      </p>
      <HomePauseWidgetOpeningStack>
        <p className="text-sm leading-5 tracking-wide text-muted-foreground">
          {t('home.pauseWidget.newContextLead', {
            defaultValue: 'The market has moved sharply.',
          })}
        </p>
        {pendingMarketBlock ? (
          <>
            <p className="leading-5" aria-hidden="true">
              {'\u200b'}
            </p>
            <HomePauseWidgetMarketRow block={pendingMarketBlock} />
          </>
        ) : null}
      </HomePauseWidgetOpeningStack>
      <HomePauseWidgetNoxCta
        label={t('home.pauseWidget.pauseWithNewContext')}
        onClick={onNewContext}
        disabled={pendingOfferBusy}
      />
    </div>
  );
}

type PostPauseProps = {
  surface: HomePauseWidgetSurface;
  onPauseWithThis: () => void;
  previewLine: HomePauseWidgetPreviewLineModel | null;
  marketBlock: HomePauseMarketBlock;
  manualCooldownRemainingMs: number;
  completedPauseCount: number;
};

/** Manual trigger cooldown — rest copy until next Let's pause. */
export function HomePausePostPauseBody({
  surface,
  onPauseWithThis: _onPauseWithThis,
  previewLine: _previewLine,
  marketBlock: _marketBlock,
  manualCooldownRemainingMs,
  completedPauseCount,
}: PostPauseProps) {
  "use memo";
  const { t } = useTranslation();
  const isDWithArchive = homePauseWidgetSurfaceIsManualCooldownWithArchive(surface);
  const isDPrime = homePauseWidgetSurfaceIsManualCooldownFirstPause(surface);
  const isD = isDWithArchive || isDPrime;

  if (isD) {
    const readyAtMs = computeManualCooldownReadyAtMs(manualCooldownRemainingMs);
    const readyAtClock =
      readyAtMs != null && readyAtMs > Date.now()
        ? formatHomePauseReadyAtClock(readyAtMs)
        : null;

    if (!readyAtClock) return null;

    const bodyKey = isDWithArchive && completedPauseCount > 0
      ? 'home.pausePostPause.cooldownArchiveBody'
      : 'home.pausePostPause.cooldownNoArchiveBody';

    return (
      <div className={homePauseWidgetBodyStack}>
        <p className="text-sm leading-5 tracking-wide text-foreground">
          {t(bodyKey, {
            time: readyAtClock,
            defaultValue: isDWithArchive && completedPauseCount > 0
              ? 'If the urge returns, another pause is available at {{time}}. Until then, your past words are here.'
              : 'If the urge returns, another pause is available at {{time}}.',
          })}
        </p>
        {isDWithArchive && completedPauseCount > 0 ? (
          <Link
            to="/archive"
            className={cn(
              homeInWidget.ctaNoxPrimary,
              'inline-flex h-10 w-full items-center justify-center border-0 shadow-none no-underline',
            )}
          >
            {t('home.pausePostPause.revisitArchive', { defaultValue: 'Revisit your archive' })}
          </Link>
        ) : null}
      </div>
    );
  }

  return null;
}

/** No open pause — expanded idle / onboarding Let's pause. */
export function HomePauseIdleExpandedBody(props: {
  onNeedPause: () => void;
  loading: boolean;
  postManualCooldownIdle: boolean;
}) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className={homePauseWidgetBodyStack}>
      {props.postManualCooldownIdle ? (
        <HomePauseWidgetTwoToneLead
          lead={t('home.pauseIdle.postManualCooldownLead', {
            defaultValue: 'The time has passed.',
          })}
          tail={t('home.pauseIdle.postManualCooldownTail', {
            defaultValue: 'Another pause is available, if you need it.',
          })}
        />
      ) : (
        <HomePauseWidgetTwoToneLead
          lead={t('home.pauseIdle.withinRangeLead', {
            defaultValue: 'The market is within your range.',
          })}
          tail={t('home.pauseIdle.withinRangeTail', {
            defaultValue: 'This is the moment to pause without urgency.',
          })}
        />
      )}
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
