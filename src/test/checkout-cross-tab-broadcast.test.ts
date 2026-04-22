import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  broadcastCheckoutConfirmed,
  subscribeToCheckoutConfirmations,
} from '@/lib/checkout-suppression-window';

/**
 * Cross-tab confirmation broadcast.
 *
 * `broadcastCheckoutConfirmed` notifies sibling tabs that a confirmation
 * was just recorded so they can suppress duplicate dialogs / refreshes.
 * jsdom doesn't dispatch real cross-document `storage` events for
 * same-window writes, so we simulate the sibling by manually firing a
 * StorageEvent on `window` for the broadcast key.
 */

const PING_KEY = 'holzen_checkout_guard_ping';

describe('cross-tab checkout-confirmed broadcast', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes a ping payload that includes mode, ts, and source tab id', () => {
    broadcastCheckoutConfirmed({ mode: 'subscription', ts: 1234567 });
    const raw = localStorage.getItem(PING_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.mode).toBe('subscription');
    expect(parsed.ts).toBe(1234567);
    expect(typeof parsed.source).toBe('string');
    expect(parsed.source.length).toBeGreaterThan(0);
  });

  it('subscribers receive payloads from sibling tabs (different source)', () => {
    const handler = vi.fn();
    const unsub = subscribeToCheckoutConfirmations(handler);

    // Simulate a sibling tab posting via the storage-event fallback path.
    const siblingPayload = JSON.stringify({
      mode: 'flex_pack_s',
      ts: 999,
      source: 'sibling-tab-id-not-ours',
    });
    window.dispatchEvent(
      new StorageEvent('storage', { key: PING_KEY, newValue: siblingPayload }),
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      mode: 'flex_pack_s',
      ts: 999,
      source: 'sibling-tab-id-not-ours',
    });
    unsub();
  });

  it('subscribers ignore self-broadcasts (same source tab id)', () => {
    const handler = vi.fn();
    const unsub = subscribeToCheckoutConfirmations(handler);

    // First broadcast from this tab — capture the source id it embeds.
    broadcastCheckoutConfirmed({ mode: 'subscription', ts: 42 });
    const raw = localStorage.getItem(PING_KEY);
    const ourSource = JSON.parse(raw!).source as string;

    // Simulate the storage event firing back at us with our own source id.
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: PING_KEY,
        newValue: JSON.stringify({ mode: 'subscription', ts: 42, source: ourSource }),
      }),
    );

    expect(handler).not.toHaveBeenCalled();
    unsub();
  });

  it('teardown removes the storage listener', () => {
    const handler = vi.fn();
    const unsub = subscribeToCheckoutConfirmations(handler);
    unsub();

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: PING_KEY,
        newValue: JSON.stringify({ mode: 'subscription', ts: 1, source: 'x' }),
      }),
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores storage events for unrelated keys and malformed payloads', () => {
    const handler = vi.fn();
    const unsub = subscribeToCheckoutConfirmations(handler);

    window.dispatchEvent(
      new StorageEvent('storage', { key: 'unrelated-key', newValue: '{}' }),
    );
    window.dispatchEvent(
      new StorageEvent('storage', { key: PING_KEY, newValue: 'not json' }),
    );
    window.dispatchEvent(
      new StorageEvent('storage', { key: PING_KEY, newValue: JSON.stringify({ mode: 'subscription' }) }),
    );

    expect(handler).not.toHaveBeenCalled();
    unsub();
  });
});
