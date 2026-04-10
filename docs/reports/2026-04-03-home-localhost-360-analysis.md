# Report: Home (`/`) localhost 360° analysis — 2026-04-03

**Scope:** `http://localhost:8080/` in the **MCP-controlled Chrome** (Chrome DevTools MCP), **desktop** Lighthouse, and **performance trace** after navigation. **Not** a substitute for production Web Vitals or hosted builds.

**Method:** See [browser-360-mcp-playbook.md](../fundamentals/browser-360-mcp-playbook.md).

---

## Environment

- **URL:** `http://localhost:8080/` (sometimes redirected to `/welcome` when unauthenticated).
- **App:** Vite dev server (port **8080**).
- **Auth:** Sessions in MCP Chrome differ from a personal browser window unless MCP is attached to that browser.

---

## Lighthouse (navigation, desktop)

| Category | Score |
|----------|------:|
| Accessibility | **84** |
| Best practices | **96** |
| SEO | **100** |

**Note:** Lighthouse in this MCP path does **not** emit a separate **Performance** category score; use **performance traces** for LCP/CLS lab metrics.

### Failed audits (summary)

| Area | Audit | Notes |
|------|--------|--------|
| Best practices | `errors-in-console` | **`/sw.js`** returned **HTML** → wrong MIME; service worker registration error (see [service-worker-registration-dev.md](../backlog/service-worker-registration-dev.md)). |
| Accessibility | `button-name` | **Three** icon-only buttons without accessible names (small controls, Radix dialog trigger, etc.). |
| Accessibility | `color-contrast` | At least one node (e.g. **`h1.text-sm`** in header) **fails contrast** in the audited theme. |
| Accessibility | `label-content-name-mismatch` | **Notification** bell: `aria-label="Notifications"` vs visible **“9”** — visible text should be part of the accessible name. |
| Accessibility | `landmark-one-main` | No **`<main>`** / `role="main"` landmark. |
| Accessibility | `target-size` | **“Collapse Market”** control **16×16px** — below **24×24px** minimum. |

**Backlog:** [lighthouse-a11y-home.md](../backlog/lighthouse-a11y-home.md) (overlaps [form-field-name-id-a11y.md](../backlog/form-field-name-id-a11y.md) for Issues/Chrome-only items).

---

## Performance trace (lab)

| Metric | Value |
|--------|------:|
| **LCP** | **~1791 ms** |
| **TTFB** (document) | **~5 ms** |
| **LCP render delay** | **~1787 ms** (~**99.7%** of LCP) |
| **CLS** | **0.06** (“good” ≤ 0.1) |

**LCP element:** text — `P.text-sm.leading-relaxed` (not an image resource).

**Forced reflow:** **~35 ms** attributed; **Recharts** (`getStringSize2`, `updateBBox`, mount) dominant; **Sonner** negligible.

**CLS cluster:** Largest cluster **~2.18s–4.12s**, score **~0.057**; many small shifts; no single DOM culprit identified by the insight.

**Backlog:** [home-recharts-layout-cost.md](../backlog/home-recharts-layout-cost.md).

---

## Third-party weight (trace insight)

| Origin | Transfer size (approx.) |
|--------|-------------------------|
| mempool.space | **2.5 MB** |
| **CoinGecko** | **254.6 kB** |
| **Google Fonts** | **77.5 kB** |
| **Supabase** | **49.8 kB** |
| **alternative.me** | **2 kB** |

Volumes reflect **many** requests in dev; **dedupe** market fetches before optimizing preconnect.

---

## Network dependency tree (insight)

- **Max critical path latency** reported: **~3,506 ms** (long chain through Vite modules → Supabase client → parallel API fan-out).
- **Preconnect:** **none** configured. Optional follow-up after dedup: [resource-hints-preconnect.md](../backlog/resource-hints-preconnect.md).

---

## Document latency (insight)

- **First document** `http://localhost:8080/`: **fast** (no redirect; **~5 ms** to download complete in trace).
- **Compression:** **failed** insight check — typical for **Vite dev** (uncompressed HTML). **Verify** Brotli/gzip for HTML on **production** hosting.

---

## Signed-in fetch pattern (earlier session)

After password sign-in, **fetch/XHR** included: **`profiles`** (repeated large selects), **`check-subscription`** (multiple POSTs), **`holzen-number`**, CoinGecko / mempool / F&G **rounds**, and many Supabase REST reads — see [home-fetch-deduplication.md](../backlog/home-fetch-deduplication.md).

---

## Related backlog (cross-reference)

| Topic | Ticket |
|--------|--------|
| Lazy routes | [route-level-code-splitting.md](../backlog/route-level-code-splitting.md) |
| SW in dev | [service-worker-registration-dev.md](../backlog/service-worker-registration-dev.md) |
| Router warnings | [react-router-v7-future-flags.md](../backlog/react-router-v7-future-flags.md) |
| PWA meta | [pwa-mobile-web-app-meta.md](../backlog/pwa-mobile-web-app-meta.md) |
| Home fetch dedup | [home-fetch-deduplication.md](../backlog/home-fetch-deduplication.md) |
| **Lighthouse axe** | [lighthouse-a11y-home.md](../backlog/lighthouse-a11y-home.md) |
| **Preconnect** | [resource-hints-preconnect.md](../backlog/resource-hints-preconnect.md) |
| **Recharts / reflow** | [home-recharts-layout-cost.md](../backlog/home-recharts-layout-cost.md) |
| **Prod HTML compression** | [hosting-production-compression.md](../backlog/hosting-production-compression.md) |

---

## Revision history

| Date | Change |
|------|--------|
| 2026-04-03 | Initial snapshot from MCP + Lighthouse + performance trace session. |
