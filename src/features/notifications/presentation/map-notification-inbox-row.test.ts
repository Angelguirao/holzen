import { describe, expect, it, vi } from 'vitest';
import { mapNotificationInboxRow, normalizeNotificationInboxItems } from './map-notification-inbox-row';
import type { NotificationsInboxRow } from '@/features/notifications/public-queries';

const t = vi.fn((key: string, opts?: { defaultValue?: string; count?: number }) => {
  if (opts && 'defaultValue' in opts) return opts.defaultValue ?? key;
  if (opts && 'count' in opts) return `${key}:${opts.count}`;
  return key;
}) as never;

describe('mapNotificationInboxRow', () => {
  it('returns null for unknown notification type', () => {
    const row = {
      id: 'n1',
      type: 'unknown',
      created_at: '2026-01-01T00:00:00Z',
      metadata: {},
    } as unknown as NotificationsInboxRow;
    expect(mapNotificationInboxRow(row, t)).toBeNull();
  });

  it('maps pause rows with action path', () => {
    const row = {
      id: 'n2',
      type: 'pause',
      created_at: '2026-01-02T00:00:00Z',
      metadata: { message: 'Take a breath' },
      action_path: '/pause',
      action_state: {},
    } as NotificationsInboxRow;

    const item = mapNotificationInboxRow(row, t);
    expect(item?.type).toBe('pause');
    expect(item?.action?.path).toBe('/pause');
    expect(item?.subtitle).toContain('Take a breath');
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
