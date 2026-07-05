import { describe, expect, it, vi } from 'vitest';
import {
  resolvePauseNotificationInboxPresentation,
  type OpenPauseNotificationContext,
} from './resolve-pause-notification-inbox-presentation';
import type { NotificationsInboxRow } from '@/features/notifications/domain/inbox-row';

const t = vi.fn((_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key) as never;

const openActive: OpenPauseNotificationContext = {
  instanceId: 'pause-1',
  state: 'active',
  openMaxExpired: false,
  pendingOfferInstanceId: null,
};

const openEngaged: OpenPauseNotificationContext = {
  instanceId: 'pause-1',
  state: 'engaged',
  openMaxExpired: false,
  pendingOfferInstanceId: null,
};

function pauseRow(overrides: Partial<NotificationsInboxRow> & { metadata?: Record<string, unknown> }): NotificationsInboxRow {
  return {
    id: 'n1',
    type: 'pause',
    created_at: '2026-01-01T00:00:00Z',
    dismissed_at: null,
    action_path: '/pause',
    action_state: { pauseInstanceId: 'pause-1' },
    metadata: {},
    ...overrides,
  } as NotificationsInboxRow;
}

describe('resolvePauseNotificationInboxPresentation', () => {
  it('shows context subtitle and Open pause for active open row', () => {
    const result = resolvePauseNotificationInboxPresentation(
      pauseRow({ metadata: { context: 'BTC moved sharply today.' } }),
      t,
      openActive,
    );
    expect(result.title).toBe('Pause ready');
    expect(result.subtitle).toContain('BTC moved');
    expect(result.action?.label).toBe('Open pause');
  });

  it('shows reflection message and Continue for engaged row', () => {
    const result = resolvePauseNotificationInboxPresentation(
      pauseRow({
        metadata: { context: 'BTC moved', message: 'Take a breath before you act.' },
      }),
      t,
      openEngaged,
    );
    expect(result.title).toBe('Continue your pause');
    expect(result.subtitle).toContain('Take a breath');
    expect(result.action?.label).toBe('Continue');
  });

  it('omits action when open-max expired', () => {
    const result = resolvePauseNotificationInboxPresentation(
      pauseRow({ metadata: { context: 'BTC moved' } }),
      t,
      { ...openEngaged, openMaxExpired: true },
    );
    expect(result.action).toBeUndefined();
    expect(result.subtitle).toBe('This pause has closed.');
  });

  it('omits action for stale instance id', () => {
    const result = resolvePauseNotificationInboxPresentation(
      pauseRow({
        action_state: { pauseInstanceId: 'old-pause' },
        metadata: { context: 'Old context' },
      }),
      t,
      openActive,
    );
    expect(result.action).toBeUndefined();
    expect(result.subtitle).toBe('This offer is no longer available.');
  });

  it('routes pending offer to Home when still queued', () => {
    const result = resolvePauseNotificationInboxPresentation(
      pauseRow({
        action_state: { pauseInstanceId: 'pending-1', pendingOffer: 'true' },
        metadata: { context: 'New volatility', pending_offer: true },
      }),
      t,
      { ...openEngaged, pendingOfferInstanceId: 'pending-1' },
    );
    expect(result.action?.path).toBe('/');
    expect(result.action?.label).toBe('View on Home');
  });
});
