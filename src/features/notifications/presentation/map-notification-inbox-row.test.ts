import { describe, expect, it, vi } from 'vitest';
import { mapNotificationInboxRow, normalizeNotificationInboxItems } from './map-notification-inbox-row';
import type { NotificationsInboxRow } from '@/features/notifications/public-queries';
import type { OpenPauseNotificationContext } from '@/features/notifications/domain/resolve-pause-notification-inbox-presentation';

const t = vi.fn((key: string, opts?: { defaultValue?: string; count?: number }) => {
  if (opts && 'defaultValue' in opts) return opts.defaultValue ?? key;
  if (opts && 'count' in opts) return `${key}:${opts.count}`;
  return key;
}) as never;

const openActive: OpenPauseNotificationContext = {
  instanceId: 'pause-1',
  state: 'active',
  openMaxExpired: false,
  pendingOfferInstanceId: null,
};

describe('mapNotificationInboxRow', () => {
  it('returns null for unknown notification type', () => {
    const row = {
      id: 'n1',
      type: 'unknown',
      created_at: '2026-01-01T00:00:00Z',
      metadata: {},
    } as unknown as NotificationsInboxRow;
    expect(mapNotificationInboxRow(row, t, openActive)).toBeNull();
  });

  it('maps pause rows with action path when open pause matches', () => {
    const row = {
      id: 'n2',
      type: 'pause',
      created_at: '2026-01-02T00:00:00Z',
      metadata: { message: 'Take a breath' },
      action_path: '/pause',
      action_state: { pauseInstanceId: 'pause-1' },
    } as NotificationsInboxRow;

    const item = mapNotificationInboxRow(row, t, {
      ...openActive,
      state: 'engaged',
    });
    expect(item?.type).toBe('pause');
    expect(item?.action?.path).toBe('/pause');
    expect(item?.subtitle).toContain('Take a breath');
    expect(item?.action?.label).toBe('Continue');
  });

  it('omits action when open-max expired', () => {
    const row = {
      id: 'n3',
      type: 'pause',
      created_at: '2026-01-02T00:00:00Z',
      metadata: { context: 'BTC moved' },
      action_path: '/pause',
      action_state: { pauseInstanceId: 'pause-1' },
    } as NotificationsInboxRow;

    const item = mapNotificationInboxRow(row, t, {
      ...openActive,
      state: 'engaged',
      openMaxExpired: true,
    });
    expect(item?.action).toBeUndefined();
    expect(item?.subtitle).toBe('This pause has closed.');
  });
});

describe('normalizeNotificationInboxItems', () => {
  it('sorts newest first and caps at 20', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: `id-${i}`,
      type: 'pause' as const,
      title: 't',
      subtitle: 's',
      timestamp: new Date(2026, 0, i + 1).toISOString(),
    }));
    const normalized = normalizeNotificationInboxItems(items);
    expect(normalized).toHaveLength(20);
    expect(new Date(normalized[0].timestamp).getTime()).toBeGreaterThan(
      new Date(normalized[1].timestamp).getTime(),
    );
  });
});
