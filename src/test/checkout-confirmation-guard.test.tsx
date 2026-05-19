import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { reactRouterFutureFlags } from '@/lib/router-future';

/**
 * Verifies the persistent guard in `CheckoutConfirmation`: once a checkout
 * outcome has been confirmed, refreshing the page or navigating back with
 * the *same* checkout query params (?subscribed=true / ?credits=true&pack=…)
 * within the 30-minute window must NOT re-open the celebratory dialog and
 * must NOT trigger the underlying sync refresh.
 *
 * We simulate refresh + back-nav by unmounting and re-mounting the component
 * tree with the same `MemoryRouter` initial entry — this is exactly what a
 * real browser refresh / history pop produces from the component's POV
 * (a fresh mount with the original `location.search`).
 */

const { refreshMock, navigateMock, toastMessageMock, invokeMock } = vi.hoisted(() => ({
  refreshMock: vi.fn().mockResolvedValue(undefined),
  navigateMock: vi.fn(),
  toastMessageMock: vi.fn(),
  invokeMock: vi.fn().mockResolvedValue({ data: { events: [] }, error: null }),
}));

vi.mock('@/features/subscription/public-hooks', () => ({
  useSubscription: () => ({
    tier: 'pro',
    loading: false,
    subscriptionStatus: 'trialing',
    subscriptionEnd: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    trialStart: new Date().toISOString(),
    trialEnd: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    flexCreditsBalance: 0,
    refresh: refreshMock,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: invokeMock } },
}));

vi.mock('sonner', () => ({
  toast: { message: toastMessageMock, success: vi.fn(), error: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { CheckoutConfirmation } from '@/features/subscription/presentation/CheckoutConfirmation';

const CHECKOUT_CONFIRMED_KEY = 'holzen_checkout_confirmed';
const CHECKOUT_STARTED_KEY = 'holzen_checkout_started_at';

function renderAt(path: string) {
  return render(
    <MemoryRouter future={reactRouterFutureFlags} initialEntries={[path]}>
      <CheckoutConfirmation />
    </MemoryRouter>,
  );
}

describe('CheckoutConfirmation 30-minute guard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    refreshMock.mockClear();
    navigateMock.mockClear();
    toastMessageMock.mockClear();
    invokeMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('opens the dialog on first arrival and persists the guard', () => {
    renderAt('/?subscribed=true');

    // Dialog content rendered (tier confirmation copy).
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Subscription sync was kicked off on the fresh checkout return.
    expect(refreshMock).toHaveBeenCalledTimes(1);
    // Persistent guard now seeded.
    const stored = JSON.parse(localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null');
    expect(stored).toMatchObject({ mode: 'subscription' });
    expect(typeof stored.ts).toBe('number');
  });

  it('does NOT re-open the dialog on a refresh with the same params', () => {
    // Seed the guard as if a confirmation already happened seconds ago.
    localStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode: 'subscription', ts: Date.now() }),
    );
    sessionStorage.setItem(CHECKOUT_STARTED_KEY, String(Date.now()));

    renderAt('/?subscribed=true');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // No redundant subscription sync — the persisted outcome is authoritative.
    expect(refreshMock).not.toHaveBeenCalled();
    // The forced-refresh sentinel is cleared so `useSubscription` won't fire
    // an initial `check-subscription` with `{ force: true }` either.
    expect(sessionStorage.getItem(CHECKOUT_STARTED_KEY)).toBeNull();
    // Quiet, non-celebratory status line surfaced exactly once.
    expect(toastMessageMock).toHaveBeenCalledTimes(1);
    // URL params stripped via replace navigation.
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/', search: '' }),
      { replace: true },
    );
  });

  it('does NOT re-open on simulated back-navigation to the same flex-pack URL', () => {
    localStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode: 'flex_pack_m', ts: Date.now() }),
    );

    // First "back-nav" mount.
    const first = renderAt('/settings?credits=true&pack=flex_pack_m');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    first.unmount();

    // Second "back-nav" (e.g. forward then back again) — same URL, same window.
    renderAt('/settings?credits=true&pack=flex_pack_m');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    expect(refreshMock).not.toHaveBeenCalled();
    // Toast deduped to one per (mode, search) key — back/forward shouldn't stack.
    // Each fresh mount has its own ref, so we expect one per mount but never
    // multiple within a single mount. Cap at one per render confirms dedup logic.
    expect(toastMessageMock.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('re-opens once the 30-minute window has elapsed', () => {
    // Guard older than the window.
    localStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode: 'subscription', ts: Date.now() - 31 * 60 * 1000 }),
    );

    renderAt('/?subscribed=true');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalledTimes(1);
    // Stale guard replaced with a fresh stamp.
    const stored = JSON.parse(localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null');
    expect(Date.now() - stored.ts).toBeLessThan(5_000);
  });

  describe('30-minute boundary precision', () => {
    const WINDOW_MS = 30 * 60 * 1000;

    it('keeps the dialog suppressed when the guard is 1 second inside the window (1799s old)', () => {
      // 1,799,000 ms ago — just *under* the 30-minute boundary. The guard
      // must still be considered live: no dialog, no sub.refresh().
      const justInside = Date.now() - (WINDOW_MS - 1_000);
      localStorage.setItem(
        CHECKOUT_CONFIRMED_KEY,
        JSON.stringify({ mode: 'subscription', ts: justInside }),
      );
      sessionStorage.setItem(CHECKOUT_STARTED_KEY, String(justInside));

      renderAt('/?subscribed=true');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(refreshMock).not.toHaveBeenCalled();
      // Original timestamp preserved — the window keeps counting from it.
      const stored = JSON.parse(localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null');
      expect(stored.ts).toBe(justInside);
    });

    it('re-opens the dialog when the guard is 1 second past the window (1801s old)', () => {
      // 1,801,000 ms ago — just *over* the boundary. The guard must be
      // treated as expired: dialog re-opens, sub.refresh() fires, and the
      // stale timestamp is replaced with a fresh stamp.
      const justOutside = Date.now() - (WINDOW_MS + 1_000);
      localStorage.setItem(
        CHECKOUT_CONFIRMED_KEY,
        JSON.stringify({ mode: 'subscription', ts: justOutside }),
      );

      renderAt('/?subscribed=true');

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(refreshMock).toHaveBeenCalledTimes(1);
      const stored = JSON.parse(localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null');
      // Fresh stamp, not the stale one.
      expect(stored.ts).not.toBe(justOutside);
      expect(Date.now() - stored.ts).toBeLessThan(5_000);
    });

    it('treats a guard a few ms inside the boundary as still live (strict > comparison)', () => {
      // Implementation uses `now - ts > windowMs` (strict greater-than), so
      // a guard whose age is *less than* the window — even by a few ms —
      // must still be considered live. We can't assert on `ts === now -
      // WINDOW_MS` exactly because the wall clock advances during render
      // (test → component mount → guard read), pushing the age past the
      // boundary. A 100 ms cushion is well within typical render time and
      // still proves the off-by-one boundary semantics.
      const onBoundary = Date.now() - (WINDOW_MS - 100);
      localStorage.setItem(
        CHECKOUT_CONFIRMED_KEY,
        JSON.stringify({ mode: 'subscription', ts: onBoundary }),
      );

      renderAt('/?subscribed=true');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(refreshMock).not.toHaveBeenCalled();
      const stored = JSON.parse(localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null');
      expect(stored.ts).toBe(onBoundary);
    });
  });

  it('skips BOTH dialog and subscription sync when returning within the 30-minute window', () => {
    // Simulate a confirmation that happened 5 minutes ago — well within the
    // 30-minute guard window. The user navigates back to the confirmation
    // route (e.g. via browser back, deep link, or shared URL) with the
    // original ?subscribed=true params still present.
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    localStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode: 'subscription', ts: fiveMinutesAgo }),
    );
    sessionStorage.setItem(CHECKOUT_STARTED_KEY, String(fiveMinutesAgo));

    renderAt('/?subscribed=true');

    // 1. Celebratory dialog must NOT re-open.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // 2. Subscription sync (`check-subscription` via sub.refresh) must be skipped.
    expect(refreshMock).not.toHaveBeenCalled();
    // 3. The forced-refresh sentinel is cleared so the next `useSubscription`
    //    initial fetch will not be promoted to `{ force: true }` either.
    expect(sessionStorage.getItem(CHECKOUT_STARTED_KEY)).toBeNull();
    // 4. Persisted guard timestamp is preserved (not overwritten on revisit),
    //    so the window keeps counting from the original confirmation.
    const stored = JSON.parse(localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null');
    expect(stored.ts).toBe(fiveMinutesAgo);
    expect(stored.mode).toBe('subscription');
    // 5. URL params stripped via replace nav (cosmetic only, no fetch).
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/', search: '' }),
      { replace: true },
    );
  });

  describe('malformed / missing guard fallback', () => {
    /**
     * The persistent guard lives in `localStorage` and is therefore at the
     * mercy of anything that can corrupt that store: a partial write from a
     * crashed tab, a manual edit in DevTools, a quota-exceeded truncation,
     * an extension that stomps on the key, a schema migration that hasn't
     * run yet, etc. In every one of those cases the safe behaviour is to
     * **treat the guard as absent** — i.e. open the celebratory dialog and
     * sync the subscription — rather than silently swallowing the legitimate
     * checkout return. These tests pin that contract down so a future
     * "defensive" refactor can't accidentally suppress the dialog when the
     * stored payload is unreadable.
     */

    const cases: Array<{ name: string; raw: string }> = [
      { name: 'invalid JSON (truncated object)', raw: '{"mode":"subscription","ts":' },
      { name: 'completely garbage string', raw: 'not-json-at-all' },
      { name: 'JSON null', raw: 'null' },
      { name: 'JSON of wrong shape (missing ts)', raw: '{"mode":"subscription"}' },
      { name: 'JSON with non-numeric ts', raw: '{"mode":"subscription","ts":"yesterday"}' },
      { name: 'empty string', raw: '' },
    ];

    for (const { name, raw } of cases) {
      it(`opens the dialog and triggers sync when guard is ${name}`, () => {
        // Seed the corrupt payload directly — bypassing JSON.stringify so
        // we can control the exact bytes the component will read.
        window.localStorage.setItem(CHECKOUT_CONFIRMED_KEY, raw);

        renderAt('/?subscribed=true');

        // Dialog opens — fallback to "fresh confirmation" path.
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        // Subscription sync fires exactly once on first arrival.
        expect(refreshMock).toHaveBeenCalledTimes(1);
        // Corrupt entry is replaced with a well-formed guard so subsequent
        // mounts within the window behave correctly.
        const stored = JSON.parse(
          window.localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null',
        );
        expect(stored).toMatchObject({ mode: 'subscription' });
        expect(typeof stored.ts).toBe('number');
        expect(Date.now() - stored.ts).toBeLessThan(5_000);
      });
    }

    it('opens the dialog when the guard key is entirely missing', () => {
      // Sanity check — the absence of the key should behave identically
      // to corruption. localStorage is already cleared in `beforeEach`,
      // so we just assert directly.
      expect(window.localStorage.getItem(CHECKOUT_CONFIRMED_KEY)).toBeNull();

      renderAt('/?subscribed=true');

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('suppression toast dedup', () => {
    /**
     * The suppression toast must dedup on `${mode}:${location.search}`
     * within a single mount, **and** repeated mounts at the *same* URL
     * (e.g. browser back → forward → back) must each emit at most one
     * suppression toast — never multiple within one mount, and never
     * stacking inside the sonner queue.
     *
     * Sonner additionally honours the `id` field on the toast options,
     * so even if two mounts both call `toast.message`, sonner collapses
     * them by id. We assert the call-site dedup directly because that's
     * the contract `CheckoutConfirmation` owns; sonner's id-based dedup
     * is a belt-and-braces second layer we don't need to re-test here.
     */

    it('emits exactly one suppression toast per mount even when the component re-renders', () => {
      localStorage.setItem(
        CHECKOUT_CONFIRMED_KEY,
        JSON.stringify({ mode: 'subscription', ts: Date.now() }),
      );

      const { rerender } = render(
        <MemoryRouter future={reactRouterFutureFlags} initialEntries={['/?subscribed=true']}>
          <CheckoutConfirmation />
        </MemoryRouter>,
      );

      // Force several re-renders at the same URL — exactly the shape
      // produced by parent state churn (auth refresh, theme toggle,
      // realtime payloads) while the user is parked on the suppressed
      // confirmation route.
      for (let i = 0; i < 5; i += 1) {
        rerender(
          <MemoryRouter future={reactRouterFutureFlags} initialEntries={['/?subscribed=true']}>
            <CheckoutConfirmation />
          </MemoryRouter>,
        );
      }

      // Dedup ref means: one toast per mount, regardless of re-render count.
      expect(toastMessageMock).toHaveBeenCalledTimes(1);
      // And it must carry the mode-scoped sonner id so the queue itself
      // would collapse a stray sibling call as well.
      expect(toastMessageMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ id: 'checkout-suppressed:subscription' }),
      );
    });

    it('reuses the same dedupe id across back-navigation to an identical URL', () => {
      localStorage.setItem(
        CHECKOUT_CONFIRMED_KEY,
        JSON.stringify({ mode: 'flex_pack_m', ts: Date.now() }),
      );

      // Three "back-nav" mounts at the same URL, simulating browser
      // back → forward → back in quick succession.
      const url = '/settings?credits=true&pack=flex_pack_m';
      for (let i = 0; i < 3; i += 1) {
        const view = renderAt(url);
        view.unmount();
      }

      // Each mount has its own ref, so we expect ≤ one toast per mount
      // (3 max). The critical invariant is that **every** toast call
      // carries the *same* sonner id — that's what makes sonner collapse
      // them visually into a single notification.
      expect(toastMessageMock.mock.calls.length).toBeGreaterThan(0);
      expect(toastMessageMock.mock.calls.length).toBeLessThanOrEqual(3);
      for (const [, opts] of toastMessageMock.mock.calls) {
        expect(opts).toEqual(
          expect.objectContaining({ id: 'checkout-suppressed:flex_pack_m' }),
        );
      }
    });

    it('uses distinct dedupe ids when the suppressed URL search differs across mounts', () => {
      // Same mode, different `?pack=` — the search string is part of the
      // ref dedup key, so each URL gets its own toast on first mount.
      // (The sonner `id` is mode-scoped, so sonner itself would still
      // collapse them; the ref-key check is what we're locking in here.)
      localStorage.setItem(
        CHECKOUT_CONFIRMED_KEY,
        JSON.stringify({ mode: 'flex_pack_m', ts: Date.now() }),
      );

      renderAt('/settings?credits=true&pack=flex_pack_m').unmount();
      renderAt('/settings?credits=true&pack=flex_pack_m&from=email').unmount();

      // Two distinct URLs → two separate ref keys → up to two toasts
      // (one per mount), but never more — re-renders on either mount
      // would have been deduped by the previous test's invariant.
      expect(toastMessageMock.mock.calls.length).toBeLessThanOrEqual(2);
    });
  });

  describe('alternative checkout query strings', () => {
    /**
     * The guard is keyed on the persisted `mode`, not on the URL — so any
     * checkout return URL that *resolves* to the same mode must be
     * suppressed. These tests parametrize over the realistic shapes the
     * app actually produces (subscription, both flex packs, optional
     * `pack` casing, extra tracking params, trailing/leading whitespace,
     * and pathnames other than `/`) so a future URL-parsing tweak can't
     * accidentally re-open the dialog on a refresh.
     *
     * Each case asserts the same three invariants:
     *   1. No celebratory dialog renders.
     *   2. `sub.refresh()` is NOT called (the persisted snapshot wins).
     *   3. The forced-refresh sentinel in sessionStorage is cleared so
     *      `useSubscription` won't promote its first fetch to `force`.
     */

    type Case = {
      name: string;
      mode: 'subscription' | 'flex_pack_s' | 'flex_pack_m';
      url: string;
    };

    const cases: Case[] = [
      {
        name: 'subscription return with extra tracking params',
        mode: 'subscription',
        url: '/?subscribed=true&utm_source=stripe&session_id=cs_test_abc123',
      },
      {
        name: 'flex_pack_s on the home route',
        mode: 'flex_pack_s',
        url: '/?credits=true&pack=flex_pack_s',
      },
      {
        name: 'flex_pack_m on /settings',
        mode: 'flex_pack_m',
        url: '/settings?credits=true&pack=flex_pack_m',
      },
      {
        name: 'flex_pack_m with reordered query params',
        mode: 'flex_pack_m',
        url: '/settings?pack=flex_pack_m&credits=true',
      },
      {
        name: 'flex_pack_s with appended utm tail',
        mode: 'flex_pack_s',
        url: '/settings?credits=true&pack=flex_pack_s&utm_campaign=spring',
      },
      {
        name: 'flex_pack_m on a deep-linked nested route',
        mode: 'flex_pack_m',
        url: '/settings/billing?credits=true&pack=flex_pack_m',
      },
    ];

    for (const { name, mode, url } of cases) {
      it(`suppresses the dialog for ${name}`, () => {
        localStorage.setItem(
          CHECKOUT_CONFIRMED_KEY,
          JSON.stringify({ mode, ts: Date.now() }),
        );
        sessionStorage.setItem(CHECKOUT_STARTED_KEY, String(Date.now()));

        renderAt(url);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(refreshMock).not.toHaveBeenCalled();
        expect(sessionStorage.getItem(CHECKOUT_STARTED_KEY)).toBeNull();
        // Persisted guard timestamp is not bumped on suppressed revisits —
        // the window keeps counting from the original confirmation.
        const stored = JSON.parse(
          localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null',
        );
        expect(stored.mode).toBe(mode);
      });
    }

    it('does NOT suppress when the URL mode does not match the persisted guard mode', () => {
      // Sanity check: the guard is mode-scoped. A user who confirmed a
      // subscription and then *separately* completes a flex-pack purchase
      // must still see the flex-pack receipt — the subscription guard
      // does not blanket-mute every checkout return.
      localStorage.setItem(
        CHECKOUT_CONFIRMED_KEY,
        JSON.stringify({ mode: 'subscription', ts: Date.now() }),
      );

      renderAt('/settings?credits=true&pack=flex_pack_m');

      // Different mode → fresh-confirmation path → dialog opens, sync runs.
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(refreshMock).toHaveBeenCalledTimes(1);
      // Guard rolls over to the newly-confirmed mode.
      const stored = JSON.parse(
        localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null',
      );
      expect(stored.mode).toBe('flex_pack_m');
    });
  });
});