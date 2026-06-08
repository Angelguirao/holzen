import type { MarketQuote } from '@/features/market/public';
import type { Entitlement } from '@/features/subscription/public';
import type { ManualPauseTriggerResult } from '@/features/pause/domain/manual-pause-trigger-result';
import type { HomePauseWidgetSurface } from '@/features/pause/domain/home/home-pause-widget-surface';
import type { HomePauseWidgetPreviewLine } from '@/features/pause/domain/home/resolve-home-pause-widget-preview-line';
import type { HomePauseMarketBlock } from '@/features/pause/domain/home/format-home-pause-market-block';

/** Open pause row fields from `usePauseHomeContext`. */
export type HomePauseOpenInstanceSnapshot = {
  lastPauseInstanceId: string | null;
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

export type HomePauseWidgetSubscriptionGate = {
  subLoading: boolean;
  hasAccess: boolean;
  entitlement: Entitlement;
  checkoutLoading: boolean;
  trialLoading: boolean;
  showPauseScheduling: boolean;
};

export type HomePauseWidgetDisplayState = {
  loading: boolean;
  error: string | null;
  marketData: MarketQuote | null;
  completedPauseCount: number;
  profileLastTriggerAt: string | null;
  newPauseArrival: boolean;
  trackedAssetId: string;
  threshold: number;
  thresholdDown: number;
  cooldownHours: number;
  manualCooldownRemainingMs: number;
  postManualCooldownIdle: boolean;
  engagedPauseMarketSettled: boolean;
  openPauseOpenMaxAnchorAt: string | null;
  previewLine: HomePauseWidgetPreviewLine;
  marketBlock: HomePauseMarketBlock;
  pendingMarketBlock: HomePauseMarketBlock | null;
};

export type HomePauseWidgetActionHandlers = {
  onNavigatePauseWithThis: () => void;
  onOpenWelcomeBackSheet: () => void;
  onAdoptPendingOffer: () => void | Promise<boolean>;
  onDeclinePendingOffer: () => void | Promise<boolean>;
  pendingOfferBusy: boolean;
  onDismissOpenPause: () => void;
  onNeedPause: () => void;
  onStartCheckoutPro: () => void;
  onStartTrial: () => void;
  onReactivate: () => void;
  manualTrigger: (mood?: string) => Promise<ManualPauseTriggerResult>;
  autoCooldownRemaining: () => number;
  nextCronCheckIn: () => number;
  manualCooldownRemaining: () => number;
  welcomeBackOpen: boolean;
  setWelcomeBackOpen: (open: boolean) => void;
  welcomeBackHandlers: {
    onContinue: () => void;
    onStartOver: () => void;
    onDiscard: () => void;
  };
};

/** Composed inside `useHomePauseWidgetInputs` — not passed from the screen. */
export type HomePauseWidgetProjectionContext = HomePauseOpenInstanceSnapshot &
  HomePauseWidgetSubscriptionGate &
  HomePauseWidgetActionHandlers &
  Pick<
    HomePauseWidgetDisplayState,
    | 'loading'
    | 'error'
    | 'marketData'
    | 'completedPauseCount'
    | 'profileLastTriggerAt'
    | 'newPauseArrival'
    | 'trackedAssetId'
    | 'threshold'
    | 'thresholdDown'
    | 'cooldownHours'
  >;

export type HomePauseWidgetBodyDisplay = {
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
  marketData: MarketQuote | null;
  showPauseScheduling: boolean;
  cooldownHours: number;
  loading: boolean;
  error: string | null;
};

export type HomePauseWidgetBodySubscription = HomePauseWidgetSubscriptionGate;

export type HomePauseWidgetBodyActions = {
  pendingOfferBusy?: boolean;
  onPauseWithThis: () => void;
  /** Engaged surfaces — opens welcome-back sheet instead of navigating immediately. */
  onOpenWelcomeBackSheet?: () => void;
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

/** Props for `HomePauseWidgetBody`. */
export type HomePauseWidgetBodyProjection = {
  surface: HomePauseWidgetSurface;
  display: HomePauseWidgetBodyDisplay;
  subscription: HomePauseWidgetBodySubscription;
  actions: HomePauseWidgetBodyActions;
};

export type HomePauseWidgetProjection = {
  sectionTitleKey: string;
  showMoonIcon: boolean;
  collapsible: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  body: HomePauseWidgetBodyProjection;
  welcomeBackOpen: boolean;
  setWelcomeBackOpen: (open: boolean) => void;
  welcomeBackHandlers: {
    onContinue: () => void;
    onStartOver: () => void;
    onDiscard: () => void;
  };
  welcomeBackHasPendingOffer: boolean;
  welcomeBackOpenMaxAnchorAt: string | null;
};

export type AssembleHomePauseWidgetProjectionInput = {
  surface: HomePauseWidgetSurface;
  display: HomePauseWidgetBodyDisplay;
  subscription: HomePauseWidgetBodySubscription;
  actions: HomePauseWidgetActionHandlers;
};
