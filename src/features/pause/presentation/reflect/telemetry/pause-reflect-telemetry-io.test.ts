import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSkipWithRepository,
} from '@/features/pause/presentation/feel/pause-feel-io';
import {
  pauseReflectOutcomeLog,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from './pause-reflect-pending-offer-telemetry-io';
import {
  pauseReflectGeneration,
  reflectGenerator,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import { pauseReflectionShareImage } from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from './pause-reflect-telemetry-io';

const trackPauseReflectPostItOpenMock = vi.hoisted(() => vi.fn());
const trackPauseReflectShareTapMock = vi.hoisted(() => vi.fn());
const trackPauseReflectWallpaperTapMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-session-ui-telemetry',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-session-ui-telemetry')
    >();
    return {
      ...actual,
      trackPauseReflectPostItOpen: trackPauseReflectPostItOpenMock,
      trackPauseReflectShareTap: trackPauseReflectShareTapMock,
      trackPauseReflectWallpaperTap: trackPauseReflectWallpaperTapMock,
    };
  },
);

describe('pause-reflect-telemetry-io', () => {
  it('re-exports session reflect UI telemetry from pause-reflect-session-ui-telemetry', () => {
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');
    const surface: PauseReflectTelemetrySurface = 'pause_reflect';
    expect(surface).toBe('pause_reflect');
    expect(trackPauseReflectPostItOpen).toBe(trackPauseReflectPostItOpenMock);
    expect(trackPauseReflectShareTap).toBe(trackPauseReflectShareTapMock);
    expect(trackPauseReflectWallpaperTap).toBe(trackPauseReflectWallpaperTapMock);
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectOutcomeLog);
    expect(trackPauseReflectShareTap).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseReflectOutcomeLog);
  });

  it('routes post-it open through the session UI telemetry module', () => {
    trackPauseReflectPostItOpen('pi-1');
    expect(trackPauseReflectPostItOpenMock).toHaveBeenCalledWith('pi-1');
  });

  it('sibling cluster: pending-offer-telemetry-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(trackPausePendingAdopted);
    expect(trackPauseReflectShareTap).not.toBe(trackPausePendingDeclined);
    expect(trackPauseReflectWallpaperTap).not.toBe(trackPauseSessionAbandoned);
  });

  it('sibling cluster: share-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectionShareImage);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectionShareImage);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseReflectionShareImage);
  });

  it('sibling cluster: pending-offer-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseAdoptPendingOffer);
    expect(trackPauseReflectShareTap).not.toBe(pauseDeclinePendingOffer);
    expect(trackPauseReflectWallpaperTap).not.toBe(getPendingPauseOfferDisplay);
    expect(trackPauseReflectPostItOpen).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(trackPauseReflectShareTap).not.toBe(pauseDeclinePendingOfferWithRepository);
    // Full cross-I/O pins: reciprocal inline pins on `pause-reflect-pending-offer-io.test.ts`;
    // dedicated session telemetry sibling: `pause-reflect-pending-offer-session-telemetry-io-sibling-parity.test.ts`;
    // pending-offer RPC vs pending-offer telemetry: `pause-reflect-pending-offer-telemetry-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: hub-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(trackPauseReflectShareTap).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(trackPauseReflectWallpaperTap).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(trackPauseReflectPostItOpen).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(trackPauseReflectShareTap).not.toBe(pauseShiftEmotionFrameHubDone);
    // Full cross-I/O pins: reciprocal inline pins on `pause-reflect-hub-io.test.ts`;
    // hub RPC vs session UI telemetry: `pause-reflect-hub-telemetry-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: generation-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectGeneration);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectGeneration);
    expect(trackPauseReflectWallpaperTap).not.toBe(reflectGenerator);
    expect(trackPauseReflectPostItOpen).not.toBe(reflectGenerator);
    // Full cross-I/O pins: `pause-reflect-generation-telemetry-io-sibling-parity.test.ts`;
    // reciprocal inline pins on `pause-reflect-generation-io.test.ts`.
  });

  it('sibling cluster: mood-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseInitialEmotionSelect);
    expect(trackPauseReflectShareTap).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseInitialEmotionSkip);
    expect(trackPauseReflectPostItOpen).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(trackPauseReflectShareTap).not.toBe(pauseInitialEmotionSelect);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseInitialEmotionSkip);
    // Full cross-I/O pins: reciprocal inline pins on `pause-feel-io.test.ts`;
    // mood RPC vs session UI telemetry: `pause-feel-telemetry-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: ambience-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectShareTap).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectWallpaperTap).not.toBe(startPauseReflectFrameFocusAmbience);
    // Full cross-I/O pins: `pause-reflect-ambience-telemetry-io-sibling-parity.test.ts`.
  });
});
