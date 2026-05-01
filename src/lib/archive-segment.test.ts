import { describe, expect, it } from 'vitest';
import {
  isArchiveEchoPause,
  itemBelongsToEchoesTab,
  itemBelongsToPausesTab,
} from '@/lib/archive-segment';

describe('archive-segment', () => {
  it('archive echo = dismissed/expired with no engaged_at', () => {
    expect(isArchiveEchoPause({ state: 'expired', engaged_at: null })).toBe(true);
    expect(isArchiveEchoPause({ state: 'dismissed', engaged_at: null })).toBe(true);
    expect(isArchiveEchoPause({ state: 'expired', engaged_at: '2026-01-01T00:00:00Z' })).toBe(false);
    expect(isArchiveEchoPause({ state: 'dismissed', engaged_at: '2026-01-01T00:00:00Z' })).toBe(false);
    expect(isArchiveEchoPause({ state: 'completed', engaged_at: null })).toBe(false);
    expect(isArchiveEchoPause({ state: 'active', engaged_at: null })).toBe(false);
  });

  const metaOf = (id: string | null) => {
    if (id === 'exp_ne') return { state: 'expired', engaged_at: null as string | null };
    if (id === 'exp_eg') return { state: 'expired', engaged_at: '2026-01-01T00:00:00Z' };
    if (id === 'dis_ne') return { state: 'dismissed', engaged_at: null };
    if (id === 'ok') return { state: 'completed', engaged_at: '2026-01-01T00:00:00Z' };
    return undefined;
  };

  it('Echoes tab is only the main pause bookmark for unengaged expired/dismissed', () => {
    expect(itemBelongsToEchoesTab({ source_type: 'pause', pause_instance_id: 'exp_ne' }, metaOf)).toBe(true);
    expect(itemBelongsToEchoesTab({ source_type: 'pause', pause_instance_id: 'dis_ne' }, metaOf)).toBe(true);
    expect(itemBelongsToEchoesTab({ source_type: 'pause', pause_instance_id: 'exp_eg' }, metaOf)).toBe(false);
    expect(itemBelongsToEchoesTab({ source_type: 'pause', pause_instance_id: 'ok' }, metaOf)).toBe(false);
    expect(itemBelongsToEchoesTab({ source_type: 'haiku', pause_instance_id: 'exp_ne' }, metaOf)).toBe(false);
  });

  it('Pauses tab excludes echo mains and companion rows on echo pauses; keeps engaged-expired on Pauses', () => {
    expect(itemBelongsToPausesTab({ source_type: 'pause', pause_instance_id: 'ok' }, metaOf)).toBe(true);
    expect(itemBelongsToPausesTab({ source_type: 'pause', pause_instance_id: 'exp_ne' }, metaOf)).toBe(false);
    expect(itemBelongsToPausesTab({ source_type: 'pause', pause_instance_id: 'exp_eg' }, metaOf)).toBe(true);
    expect(itemBelongsToPausesTab({ source_type: 'haiku', pause_instance_id: 'ok' }, metaOf)).toBe(true);
    expect(itemBelongsToPausesTab({ source_type: 'haiku', pause_instance_id: 'exp_ne' }, metaOf)).toBe(false);
    expect(itemBelongsToPausesTab({ source_type: 'haiku', pause_instance_id: 'exp_eg' }, metaOf)).toBe(true);
  });
});
