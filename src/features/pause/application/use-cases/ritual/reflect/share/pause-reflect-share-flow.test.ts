import { describe, expect, it } from 'vitest';

import { buildReflectionShareText } from '@/features/pause/domain/reflect/share/reflection-share-text';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';

import {
  buildReflectionShareText as buildTextFromTextFlow,
} from './pause-reflection-share-text-flow';
import {
  buildReflectionShareTelegramUrl as buildTelegramFromChannelFlow,
  buildReflectionShareTweetUrl as buildTweetFromChannelFlow,
  buildReflectionShareWhatsAppUrl as buildWhatsAppFromChannelFlow,
} from './pause-reflection-share-channel-urls-flow';
import { runReflectionShareImage as runShareImageFromImageFlow } from './pause-reflection-share-image-flow';
import {
  buildReflectionShareTelegramUrl as buildTelegramFromOrchestrationFlow,
  buildReflectionShareText as buildTextFromOrchestrationFlow,
  buildReflectionShareTweetUrl as buildTweetFromOrchestrationFlow,
  buildReflectionShareWhatsAppUrl as buildWhatsAppFromOrchestrationFlow,
  deliverReflectionShareImage,
  runReflectionShareImage as runShareImageFromOrchestrationFlow,
} from './pause-reflect-share-orchestration-flow';
import * as shareFlowModule from './pause-reflect-share-flow';
import {
  buildReflectionShareText as buildTextFromFlow,
  buildReflectionShareTelegramUrl as buildTelegramFromFlow,
  buildReflectionShareTweetUrl as buildTweetFromFlow,
  buildReflectionShareWhatsAppUrl as buildWhatsAppFromFlow,
  runReflectionShareImage,
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-share-flow';
import { runReflectionShareImage as runShareImageDirect } from './run-reflection-share-image';
import {
  trackPauseReflectPostItOpen as trackPostItDirect,
  trackPauseReflectShareTap as trackShareTapDirect,
  trackPauseReflectWallpaperTap as trackWallpaperDirect,
} from '../telemetry/pause-reflect-session-ui-telemetry';
import {
  trackPauseReflectPostItOpen as trackPostItFromTelemetryFlow,
  trackPauseReflectShareTap as trackShareTapFromTelemetryFlow,
  trackPauseReflectWallpaperTap as trackWallpaperFromTelemetryFlow,
} from '../telemetry/pause-reflect-telemetry-flow';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '../telemetry/pause-pending-offer-telemetry-flow';
import {
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
} from '../pending-offer/pause-reflect-pending-offer-flow';
import {
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromFlowsFlow,
  runPauseOutcomeLog as runOutcomeLogFromFlowsFlow,
} from '../flows/pause-reflect-flows-flow';
import {
  buildShiftEmotionFrameHubLogBundle as buildLogBundleFromHubFlow,
  resolveShiftFrameHubDonePresentation as resolvePresentationFromHubFlow,
  runShiftEmotionFrameHubDone as runShiftHubDoneFromHubFlow,
} from '../hub/pause-reflect-hub-flow';

describe('pause-reflect-share-flow', () => {
  it('re-exports share orchestration + domain builders + session UI telemetry from leaf modules', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildTextFromFlow).toBe('function');
    expect(typeof buildTelegramFromFlow).toBe('function');
    expect(typeof buildTweetFromFlow).toBe('function');
    expect(typeof buildWhatsAppFromFlow).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect(runReflectionShareImage).toBe(runShareImageDirect);
    expect(buildTextFromFlow).toBe(buildReflectionShareText);
    expect(buildTelegramFromFlow).toBe(buildReflectionShareTelegramUrl);
    expect(buildTweetFromFlow).toBe(buildReflectionShareTweetUrl);
    expect(buildWhatsAppFromFlow).toBe(buildReflectionShareWhatsAppUrl);
    expect(trackPauseReflectPostItOpen).toBe(trackPostItDirect);
    expect(trackPauseReflectShareTap).toBe(trackShareTapDirect);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperDirect);
    expect(trackPauseReflectPostItOpen).toBe(trackPostItFromTelemetryFlow);
    expect(trackPauseReflectShareTap).toBe(trackShareTapFromTelemetryFlow);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperFromTelemetryFlow);
  });

  it('umbrella bindings match share subcluster CI anchors (leaf parity)', () => {
    expect(buildTextFromFlow).toBe(buildTextFromTextFlow);
    expect(buildTelegramFromFlow).toBe(buildTelegramFromChannelFlow);
    expect(buildTweetFromFlow).toBe(buildTweetFromChannelFlow);
    expect(buildWhatsAppFromFlow).toBe(buildWhatsAppFromChannelFlow);
    expect(runReflectionShareImage).toBe(runShareImageFromImageFlow);

    expect(buildTextFromFlow).toBe(buildTextFromOrchestrationFlow);
    expect(buildTelegramFromFlow).toBe(buildTelegramFromOrchestrationFlow);
    expect(buildTweetFromFlow).toBe(buildTweetFromOrchestrationFlow);
    expect(buildWhatsAppFromFlow).toBe(buildWhatsAppFromOrchestrationFlow);
    expect(runReflectionShareImage).toBe(runShareImageFromOrchestrationFlow);
  });

  it('sibling cluster: share-flow exports stay distinct from session reflect UI telemetry-flow exports', () => {
    expect(runReflectionShareImage).not.toBe(trackPauseReflectPostItOpen);
    expect(runReflectionShareImage).not.toBe(trackPauseReflectShareTap);
    expect(runReflectionShareImage).not.toBe(trackPauseReflectWallpaperTap);
    expect(buildTextFromFlow).not.toBe(trackPauseReflectPostItOpen);
    expect(buildTelegramFromFlow).not.toBe(trackPauseReflectShareTap);
    expect(buildWhatsAppFromFlow).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('sibling cluster: share-flow exports stay distinct from pending-offer RPC and telemetry-flow exports', () => {
    expect(runReflectionShareImage).not.toBe(runAdoptPendingPauseOffer);
    expect(runReflectionShareImage).not.toBe(runDeclinePendingPauseOffer);
    expect(buildTextFromFlow).not.toBe(trackPausePendingAdopted);
    expect(buildTelegramFromFlow).not.toBe(trackPausePendingDeclined);
    expect(buildWhatsAppFromFlow).not.toBe(trackPauseSessionAbandoned);
    expect(trackPauseReflectPostItOpen).not.toBe(runAdoptPendingPauseOffer);
    expect(trackPauseReflectShareTap).not.toBe(trackPausePendingAdopted);
  });

  it('sibling cluster: share-flow exports stay distinct from share-orchestration-flow deliver leaf', () => {
    expect('deliverReflectionShareImage' in shareFlowModule).toBe(false);
    expect(runReflectionShareImage).toBe(runShareImageFromOrchestrationFlow);
    expect(runReflectionShareImage).not.toBe(deliverReflectionShareImage);
    expect(trackPauseReflectPostItOpen).not.toBe(deliverReflectionShareImage);
    expect(trackPauseReflectShareTap).not.toBe(deliverReflectionShareImage);
  });

  it('sibling cluster: flows-flow exports stay distinct from share umbrella exports', () => {
    expect(runReflectionShareImage).not.toBe(resolvePreflightFromFlowsFlow);
    expect(runReflectionShareImage).not.toBe(runOutcomeLogFromFlowsFlow);
    expect(buildTextFromFlow).not.toBe(resolvePreflightFromFlowsFlow);
    expect(buildTelegramFromFlow).not.toBe(runOutcomeLogFromFlowsFlow);
    expect(trackPauseReflectShareTap).not.toBe(runOutcomeLogFromFlowsFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(resolvePreflightFromFlowsFlow);
  });

  it('sibling cluster: share-flow exports stay distinct from hub-flow exports', () => {
    expect(runReflectionShareImage).not.toBe(runShiftHubDoneFromHubFlow);
    expect(runReflectionShareImage).not.toBe(buildLogBundleFromHubFlow);
    expect(buildTextFromFlow).not.toBe(resolvePresentationFromHubFlow);
    expect(trackPauseReflectPostItOpen).not.toBe(runShiftHubDoneFromHubFlow);
    expect(trackPauseReflectShareTap).not.toBe(buildLogBundleFromHubFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(resolvePresentationFromHubFlow);
    // Full cross-umbrella pins: `pause-reflect-hub-share-flow-sibling-parity.test.ts`.
  });
});
