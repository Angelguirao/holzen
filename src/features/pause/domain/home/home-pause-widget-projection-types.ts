import type { MarketQuote } from '@/features/market/public';
import type { Entitlement } from '@/features/subscription/public';
import type { ManualPauseTriggerResult } from '@/features/pause/domain/manual-pause-trigger-result';
import type { HomePauseWidgetMode } from '@/features/pause/domain/home/home-pause-widget-mode';
import type { HomePauseWidgetPreviewLine } from '@/features/pause/domain/home/resolve-home-pause-widget-preview-line';
import type { HomePauseMarketBlock } from '@/features/pause/domain/home/format-home-pause-market-block';

/** Open pause row fields the widget needs (from `usePauseHomeContext`). */
export type HomePauseOpenInstanceSnapshot = {
  hasOpenPause: boolean;
  openPauseState: 'active' | 'engaged' | null;
  openPauseSource: string | null;
  openPauseEngagedAt: string | null;
  openPauseMetadata: Record<string, unknown> | null;
  openPauseCreatedAt: string | null;
  hasReflectionStep: boolean;
  reflectionMessage: string | null;
  hasOpenPauseStepEvents: boolean;
  contextSnapshot: Record<string, unknown> | null;
  contextText: string | null;
};

/** Screen-level inputs wired in `useHomeScreen` (subscription, actions, profile). */
export type HomePauseWidgetScreenContext = {
  subLoading: boolean;
  hasAccess: boolean;
  entitlement: Entitlement;
  checkoutLoading: boolean;
  trialLoading: boolean;
  loading: boolean;
  error: string | null;
  marketData: MarketQuote | null;
  showPauseScheduling: boolean;
  completedPauseCount: number | null;
  profileLastTriggerAt: string | null;
  newPauseArrival: boolean;
  trackedAssetId: string;
  threshold: number;
  thresholdDown: number;
  cooldownHours: number;
  autoCooldownRemaining: () => number;
  nextCronCheckIn: () => number;
  manualCooldownRemaining: () => number;
  manualCooldownRemainingMs: number;
};

/** Navigation / mutation callbacks from `useHomePauseActions` and pending-offer hooks. */
export type HomePauseWidgetActionHandlers = {
  onNavigatePauseWithThis: () => void;
  onAdoptPendingOffer: () => void | Promise<boolean>;
  onDeclinePendingOffer: () => void | Promise<boolean>;
  pendingOfferBusy: boolean;
  onDismissOpenPause: () => void;
  onNeedPause: () => void;
  onStartCheckoutPro: () => void;
  onStartTrial: () => void;
  onReactivate: () => void;
  manualTrigger: (mood?: string) => Promise<ManualPauseTriggerResult>;
};

export type UseHomePauseWidgetProjectionParams = HomePauseOpenInstanceSnapshot &
  HomePauseWidgetScreenContext &
  HomePauseWidgetActionHandlers;

/** Props for `HomePauseWidgetBody` — flat DTO for minimal JSX churn. */
export type HomePauseWidgetBodyProjection = {
  widgetMode: HomePauseWidgetMode;
  previewLine: HomePauseWidgetPreviewLine;
  marketBlock: HomePauseMarketBlock;
  pendingMarketBlock: HomePauseMarketBlock | null;
  postManualCooldownIdle: boolean;
  engagedPauseMarketSettled: boolean;
  openPauseOpenMaxAnchorAt: string | null;
  openPauseState: 'active' | 'engaged' | null;
  manualCooldownRemainingMs: number;
  completedPauseCount: number;
  profileLastTriggerAt: string | null;
  subLoading: boolean;
  hasAccess: boolean;
  entitlement: Entitlement;
  checkoutLoading: boolean;
  trialLoading: boolean;
  loading: boolean;
  error: string | null;
  marketData: MarketQuote | null;
  showPauseScheduling: boolean;
  cooldownHours: number;
  pendingOfferBusy?: boolean;
  onPauseWithThis: () => void;
  onPauseWithNewContext?: () => void;
  onDeclinePendingOffer?: () => void;
  onDismissOpenPause: () => void;
  onReflectionRetry: (mood?: string) => Promise<ManualPauseTriggerResult>;
  autoCooldownRemaining: () => number;
  nextCronCheckIn: () => number;
  manualCooldownRemaining: () => number;
  onNeedPause: () => void;
  onPauseAgain: () => void;
  onStartCheckoutPro: () => void;
  onStartTrial: () => void;
  onReactivate: () => void;
};

export type HomePauseWidgetProjection = {
  sectionTitleKey: string;
  showMoonIcon: boolean;
  collapsible: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  body: HomePauseWidgetBodyProjection;
};

export type BuildHomePauseWidgetProjectionInput = {
  widgetMode: HomePauseWidgetMode;
  previewLine: HomePauseWidgetPreviewLine;
  marketBlock: HomePauseMarketBlock;
  pendingMarketBlock: HomePauseMarketBlock | null;
  postManualCooldownIdle: boolean;
  engagedPauseMarketSettled: boolean;
  openPauseOpenMaxAnchorAt: string | null;
  manualCooldownRemainingMs: number;
  params: UseHomePauseWidgetProjectionParams;
};
