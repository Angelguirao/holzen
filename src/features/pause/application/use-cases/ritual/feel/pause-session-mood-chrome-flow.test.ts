import { describe, expect, it } from 'vitest';

import {
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runPauseSessionChromeCloseAction,
} from '@/features/pause/domain/feel/pause-session-mood-chrome-flow';

import {
  resolvePauseSessionChromeCloseAction as resolveChromeCloseFromFlow,
  runDeepPausePickerEntryIfPro as runDeepPickerFromFlow,
  runPauseSessionChromeCloseAction as runChromeCloseFromFlow,
} from './pause-session-mood-chrome-flow';

describe('pause-session-mood-chrome-flow', () => {
  it('re-exports session mood chrome helpers from domain', () => {
    expect(typeof resolveChromeCloseFromFlow).toBe('function');
    expect(typeof runDeepPickerFromFlow).toBe('function');
    expect(typeof runChromeCloseFromFlow).toBe('function');

    expect(resolveChromeCloseFromFlow).toBe(resolvePauseSessionChromeCloseAction);
    expect(runDeepPickerFromFlow).toBe(runDeepPausePickerEntryIfPro);
    expect(runChromeCloseFromFlow).toBe(runPauseSessionChromeCloseAction);
  });
});
