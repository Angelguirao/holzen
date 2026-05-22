import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import { buildShiftEmotionFrameHubLogBundle as buildLogBundleDirect } from '@/features/pause/domain/reflect/hub/shift-emotion-log';
import { resolveShiftFrameHubDonePresentation as resolvePresentationDirect } from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';

import {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
} from './pause-reflect-hub-io';

describe('pause-reflect-hub-io re-exports', () => {
  it('re-exports shift-frame hub domain helpers from reflect/hub leaf paths', () => {
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');

    expect(buildShiftEmotionFrameHubLogBundle).toBe(buildLogBundleDirect);
    expect(resolveShiftFrameHubDonePresentation).toBe(resolvePresentationDirect);
  });
});
