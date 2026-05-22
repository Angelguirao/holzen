import { describe, expect, it } from 'vitest';
import {
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runPauseSessionChromeCloseAction,
} from './pause-session-mood-chrome-flow';

describe('pause-session-mood-chrome-flow', () => {
  it('re-exports mood chrome leaf modules for application cluster anchor', () => {
    expect(resolvePauseSessionChromeCloseAction).toBeTypeOf('function');
    expect(runPauseSessionChromeCloseAction).toBeTypeOf('function');
    expect(runDeepPausePickerEntryIfPro).toBeTypeOf('function');
    expect(resolvePauseSessionChromeCloseAction('done')).toBe('return');
  });
});
