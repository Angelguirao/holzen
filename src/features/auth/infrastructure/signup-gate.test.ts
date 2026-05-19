import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkSignupGate, SIGNUPS_ENABLED, _resetSignupGateCache } from './signup-gate';

type MockClient = { rpc: ReturnType<typeof vi.fn> };

function makeClient(impl: () => Promise<{ data: unknown; error: unknown }>): MockClient {
  return { rpc: vi.fn().mockImplementation(impl) };
}

describe('checkSignupGate', () => {
  beforeEach(() => {
    _resetSignupGateCache();
  });

  it('returns allow=true when RPC reports enabled and under cap', async () => {
    const client = makeClient(() =>
      Promise.resolve({
        data: { enabled: true, allow: true, max_per_day: 100, today_count: 3 },
        error: null,
      }),
    );

    const res = await checkSignupGate(client as never);
    expect(res.allow).toBe(true);
    expect(res.enabled).toBe(true);
    expect(res.maxPerDay).toBe(100);
    expect(res.todayCount).toBe(3);
    expect(res.reason).toBeUndefined();
  });

  it('returns disabled reason when signups are turned off', async () => {
    const client = makeClient(() =>
      Promise.resolve({
        data: { enabled: false, allow: false, max_per_day: null, today_count: 0 },
        error: null,
      }),
    );

    const res = await checkSignupGate(client as never);
    expect(res.allow).toBe(false);
    expect(res.reason).toBe('disabled');
  });

  it('returns daily_cap reason when daily count >= cap', async () => {
    const client = makeClient(() =>
      Promise.resolve({
        data: { enabled: true, allow: false, max_per_day: 10, today_count: 10 },
        error: null,
      }),
    );

    const res = await checkSignupGate(client as never);
    expect(res.allow).toBe(false);
    expect(res.reason).toBe('daily_cap');
  });

  it('treats null max_per_day as unlimited', async () => {
    const client = makeClient(() =>
      Promise.resolve({
        data: { enabled: true, allow: true, max_per_day: null, today_count: 10_000 },
        error: null,
      }),
    );

    const res = await checkSignupGate(client as never);
    expect(res.allow).toBe(true);
    expect(res.maxPerDay).toBeNull();
  });

  it('falls back to compile-time SIGNUPS_ENABLED when RPC errors', async () => {
    const client = makeClient(() =>
      Promise.resolve({ data: null, error: { message: 'boom' } }),
    );

    const res = await checkSignupGate(client as never);
    expect(res.allow).toBe(SIGNUPS_ENABLED);
    expect(res.enabled).toBe(SIGNUPS_ENABLED);
  });

  it('caches within the TTL window', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { enabled: true, allow: true, max_per_day: 50, today_count: 1 },
      error: null,
    });

    const client = { rpc } as MockClient;

    await checkSignupGate(client as never);
    await checkSignupGate(client as never);
    await checkSignupGate(client as never);

    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
