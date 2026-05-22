import { describe, expect, it } from 'vitest';

import {
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runPauseSessionChromeCloseAction,
} from './pause-session-mood-chrome-flow';

describe('pause-session-mood-chrome-flow', () => {
  it('re-exports session mood chrome helpers from domain', () => {
    expect(typeof resolvePauseSessionChromeCloseAction).toBe('function');
    expect(typeof runDeepPausePickerEntryIfPro).toBe('function');
    expect(typeof runPauseSessionChromeCloseAction).toBe('function');
  });
});
