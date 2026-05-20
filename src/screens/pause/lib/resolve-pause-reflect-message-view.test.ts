import { describe, expect, it } from 'vitest';
import { resolvePauseReflectMessageView } from '@/screens/pause/lib/resolve-pause-reflect-message-view';

describe('resolvePauseReflectMessageView', () => {
  it('prefers error over loading', () => {
    expect(
      resolvePauseReflectMessageView({
        reflectionError: 'fail',
        reflectionLoading: true,
        reflectionMessage: '',
      }),
    ).toBe('error');
  });

  it('shows loading when generating with empty message', () => {
    expect(
      resolvePauseReflectMessageView({
        reflectionError: null,
        reflectionLoading: true,
        reflectionMessage: '  ',
      }),
    ).toBe('loading');
  });

  it('shows body when message exists even if still loading', () => {
    expect(
      resolvePauseReflectMessageView({
        reflectionError: null,
        reflectionLoading: true,
        reflectionMessage: 'Hello',
      }),
    ).toBe('body');
  });
});
