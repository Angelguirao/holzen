# Browser “360°” review (Chrome DevTools MCP)

Use this when you want a **structured pass** over the **live SPA**—network, console, Lighthouse (a11y / best practices / SEO), and performance traces—**without** replacing reading source. It complements:

- **[http-review-playbooks.md](http-review-playbooks.md)** — API flows (Bruno/Postman), not the browser.
- **[../backlog/e2e-browser-automation.md](../backlog/e2e-browser-automation.md)** — durable **E2E** regression; MCP is **interactive inspection**, not a CI substitute.

## Prerequisites

- **Cursor** (or another client) has the **Chrome DevTools MCP** enabled (`chrome-devtools-mcp` / `user-chrome-devtools` in this workspace).
- **Google Chrome** available; the MCP server may **launch its own profile** or attach via **`--browser-url`** / **`--autoConnect`** (see upstream `chrome-devtools-mcp` readme on npm).
- App running locally (e.g. **`http://localhost:8080/`** per [README.md](../../README.md)).

**Important:** Unless you attach MCP to **your** Chrome, the MCP browser may have a **different session** (cookies) than the window you use manually. Sign-in flows must be run **in the same browser MCP controls** to inspect an authenticated home page.

## Suggested order (360°)

1. **Pages** — `list_pages` → `select_page` with the tab you care about (`pageId`).
2. **Navigation** — `navigate_page` (`type: url` or `reload` with `ignoreCache` for a cold-ish load).
3. **Network** — `list_network_requests` (optionally `resourceTypes: ["fetch","xhr"]` first). Use `includePreservedRequests: true` if you need history across the last few navigations.
4. **Console** — `list_console_messages` with `includePreservedMessages: true`; filter `types: ["error","warn"]` for a short list, then run without filter for Issues / verbose.
5. **Lighthouse** — `lighthouse_audit` (`mode: navigation` or `snapshot`, `device: desktop` or `mobile`). *Note:* in current MCP integration, Lighthouse categories are **accessibility, best practices, SEO**; for **lab performance** use a trace (step 6), not Lighthouse alone.
6. **Performance trace** — `performance_start_trace` (save `filePath` if you want the `.json.gz` in the repo or to open in DevTools **Performance**). Typical: `reload: true`, `autoStop: true`.
7. **Trace insights** — After a trace, call `performance_analyze_insight` with the **`insightSetId`** from the trace output (often `NAVIGATION_0`) and one of:
   - `LCPBreakdown` — where LCP time goes (TTFB vs render delay).
   - `CLSCulprits` — layout shift clusters.
   - `ForcedReflow` — layout thrashing / `offsetWidth`-style work.
   - `ThirdParties` — bytes and main-thread cost by origin.
   - `NetworkDependencyTree` — critical path length, **preconnect** hints.
   - `DocumentLatency` — first document redirect, TTFB, compression.

Optional: `take_snapshot` (a11y tree), `take_screenshot`, `evaluate_script` for one-off probes.

## What to record

- **URL + device + signed-in or not** (state changes results).
- **Scores / metrics** (Lighthouse category scores; LCP, CLS, critical path ms).
- **Top failures** (Lighthouse audit ids; console error messages).
- **Follow-ups** — add backlog tickets; link a **dated report** under `docs/reports/` when you snapshot a full run (see [2026-04-03-home-localhost-360-analysis.md](../reports/2026-04-03-home-localhost-360-analysis.md)).

## Limits

- **Dev vs prod:** Vite dev **request counts** and **compression** differ from production; interpret **network** and **DocumentLatency** compression checks accordingly.
- **Third-party transfer totals** may aggregate many requests to the same host.
- **Insight sets** expire when the MCP session drops; re-run a trace if `performance_analyze_insight` no longer finds `NAVIGATION_0`.

## In-app console prefixes (source)

The SPA can emit **`[holzen:boot]`**, **`[holzen:auth]`**, **`[holzen:profile]`**, **`[holzen:router]`**, **`[holzen:manual]`**, **`[holzen:home]`**, **`[holzen:pause]`**, **`[holzen:subscription]`**, **`[holzen:query]`** — all wired through `src/lib/holzen-console.ts` (except legacy `console.error` paths).

**Production / hosted builds (privacy default):** **`[holzen:*]`** stays off unless you opt in: **`VITE_HOLZEN_DEBUG=1`** in env, **`?holzenDebug=1`** once (session, param stripped), or **`localStorage.setItem('holzen:debug','1')`** + reload.

**Local dev:** All prefixes are emitted (`import.meta.env.DEV`) — filter **`holzen:`** for boot → auth → profile → route → subscription → query → pause → manual.

**Query cache:** Same gate as **`isHolzenDebugEnabled()`** (verbose builds + dev).

**Edge (cron / workers):** Handlers log **structured JSON** via **`withRequestLogging`** and **`createLogger`** (`observe.ts`) — grep **`fn`** (matches the function folder name, e.g. **`fetch-source-feeds`**, **`refresh-btc-prices`**) and stable **`msg`** / **`extra.holzen_event`** tokens. This is **not** the same as the browser **`[holzen:*]`** lines (those come from `holzen-console.ts` only). See [logging-strategy.md](../ops/logging-strategy.md).

## Related backlog

- [service-worker-registration-dev.md](../backlog/service-worker-registration-dev.md) — SW / MIME noise in dev.
- [home-fetch-deduplication.md](../backlog/home-fetch-deduplication.md) — redundant fetches after sign-in.
- [lighthouse-a11y-home.md](../backlog/lighthouse-a11y-home.md) — Lighthouse axe failures on Home.
- [resource-hints-preconnect.md](../backlog/resource-hints-preconnect.md) — optional `preconnect` after deduping fetches.
- [home-recharts-layout-cost.md](../backlog/home-recharts-layout-cost.md) — Recharts / forced reflow on Home.
- [hosting-production-compression.md](../backlog/hosting-production-compression.md) — verify HTML compression in prod.
