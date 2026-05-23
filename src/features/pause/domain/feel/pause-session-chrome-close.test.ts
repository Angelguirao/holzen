import { describe, expect, it, vi } from 'vitest';
import {
  resolvePauseSessionChromeCloseAction,
  runPauseSessionChromeCloseAction,
} from './pause-session-chrome-close';

describe('pause-session-chrome-close', () => {
  it('resolves chrome close to return or request exit', () => {
    expect(resolvePauseSessionChromeCloseAction('done')).toBe('return');
    expect(resolvePauseSessionChromeCloseAction('session')).toBe('request_exit');

    const onReturn = vi.fn();
    const onRequestExit = vi.fn();
    runPauseSessionChromeCloseAction('return', { onReturn, onRequestExit });
    expect(onReturn).toHaveBeenCalledTimes(1);
    expect(onRequestExit).not.toHaveBeenCalled();

    onReturn.mockClear();
    runPauseSessionChromeCloseAction('request_exit', { onReturn, onRequestExit });
    expect(onRequestExit).toHaveBeenCalledTimes(1);
    expect(onReturn).not.toHaveBeenCalled();
  });
});
