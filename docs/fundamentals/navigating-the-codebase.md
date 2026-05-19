# Navigating the Holzen codebase

This guide walks a new contributor through the repository in roughly the order you would discover it while running the app locally. It complements [README.md](../README.md) (setup and scripts) and [AGENTS.md](../AGENTS.md) (conventions for automation). Deep dives on the AI pause pipeline and cron jobs live in [ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md) and [cron-setup.md](../ops/cron-setup.md).

**Pause-first shipped path (2026-05):** sign in → **Home** (trial via `ensure-trial-subscription`) → **`/pause`** ritual → **Archive** to browse past pauses → **Journey** overview (streak/count) → **Settings**. Do not import `@/legacy/*`; full IA is tag `full-ia-pre-strip`. Manifest: [active-surface.md](../ops/active-surface.md).

---

## 1. Orientation: what to read first

1. **[src/README.md](../../src/README.md)** + **[active-surface.md](../ops/active-surface.md)** — what ships in the active tree.
2. **[README.md](../README.md)** — Node version, `npm install`, environment files (`.env`, `.env.hosted.local`, `.env.localstack.local`), and npm scripts (`dev` on port **8080**, Supabase CLI wrappers).
3. **[AGENTS.md](../AGENTS.md)** — Where routes, pages, hooks, and Supabase artifacts live; import alias `@/` → `src/`; note on ESLint volume.
4. **[architecture/c4-holzen.md](../architecture/c4-holzen.md)** — C4 **System Context** and **Container** diagrams (and [workspace.dsl](../architecture/workspace.dsl) for Structurizr).
5. **This doc** — How those pieces connect at runtime.
6. **Optional:** [mental-models-for-contributors.md](mental-models-for-contributors.md) — SPA, React hooks, and Supabase-in-the-browser in a **backend-friendly** frame, plus suggested external links (not Holzen-specific).
7. **Refactors:** [refactoring-strategy.md](refactoring-strategy.md) — how we split large pages/hooks incrementally; backlog checklist in [react-page-and-hook-splitting.md](../backlog/react-page-and-hook-splitting.md).

---

## 2. Repository top level (mental map)

| Path | Role |
|------|------|
| `src/` | React application (TypeScript). |
| `public/` | Static assets (icons, manifest pieces, etc.). |
| `supabase/migrations/` | Postgres schema and RLS — **source of truth** for the database. |
| `supabase/functions/` | Deno edge functions (HTTP APIs, crons, webhooks). |
| `supabase/config.toml` | Supabase project id and **`[functions.<name>]`** per deployable folder — keep **one block per function** so local serve and hosted deploys match. |
| `index.html` | Vite HTML entry: default SEO/PWA meta, `#root`, inline boot-recovery — see [index-html-and-spa-shell.md](index-html-and-spa-shell.md). |
| `vite.config.ts` | Dev server (port 8080), `@` alias, PWA inject-manifest, **optional Supabase URL/key fallbacks** on dev serve and `vite build` when not in `localstack` mode; **`transformIndexHtml`** injects **`preconnect`** for Supabase, Google Fonts, and CoinGecko ([resource-hints-preconnect.md](../backlog/resource-hints-preconnect.md)). |
| `vitest.config.ts` | Tests: jsdom, `src/test/setup.ts`, same `@` alias as Vite. |

---

## 3. Boot sequence: from `index.html` to first paint

Full diagram, metadata, boot-recovery, and domain notes: **[index-html-and-spa-shell.md](index-html-and-spa-shell.md)**.

1. **`index.html`** loads the Vite entry script, sets **`class="dark"`** on `<html>`, and runs an **inline boot-recovery** script (cache reset + fallback UI if the bundle never mounts).
2. **`src/main.tsx`** is the JS entry:
   - Inits Sentry, cid, PostHog; registers global `error` / `unhandledrejection` handlers and a **crash screen** if React fails before mount.
   - **Static imports** `i18n`, `App.tsx`, and `sw-update`, then `createRoot(#root).render(<App />)`.
3. **`src/App.tsx`** wraps the tree in `ErrorBoundary`, `QueryClientProvider`, `TooltipProvider`, toasts, offline banner, `BrowserRouter`, and **`AuthProvider`**.

**Why it matters:** throws during static import of `App` or `i18n` are caught in `main.tsx`; errors inside React use `ErrorBoundary`.

---

## 4. Routing and layout (`src/App.tsx`)

Routes are declared in **`src/App.tsx`**. Screen modules under **`src/screens/`** are **`React.lazy`**-loaded. **`Suspense`** around **`Routes`** shows a small full-screen fallback while a chunk downloads. Two patterns matter:

- **`ProtectedRoute`** — If auth is still loading, show `AuthLoading` (`src/app/components/`). If no user, redirect to `/welcome`. Otherwise render children.
- **`PublicOnlyRoute`** — Logged-in users are redirected to `/`.

**Main shell (four tabs):** `/`, `/archive`, `/journey`, `/settings` (+ nested `/settings/about`, `/settings/billing-history`, `/settings/:section`) use **`AppLayout`** (`src/app/components/AppLayout.tsx`): max-width column, header (“Holzen” + `NotificationBell` from `features/notifications/public-hooks`), **`<main id="main-content">`** around **`Outlet`**, and **`BottomNav`** (Home, Archive, Journey, Settings). `AppLayout` uses `useShellProfile` + `ShellPauseChrome` (pause modal/banner; `useHolzen` only inside that component) and passes pause-ready state via outlet context; **`HolzenProvider`** wraps signed-in routes from `screens/home/hooks/use-holzen.ts`.

**Full-screen authenticated routes** (no `AppLayout`, `RobotsNoIndex`): `/pause`, companion deep links `/companion/{zoom-out,history,signal,grounding}/:pauseInstanceId`, `/admin`, `/admin/smoke-test`, `/admin/sentry-alerts`, `/admin/edge-coverage`.

**Public / utility:** `/welcome` (landing), `/auth`, `/reset-password`, `/unsubscribe`, `/terms`, `/privacy`, `/about`, `/blog`, `/blog/:slug`, `/roadmap`, `/reserve`.

**Redirects:** `/index` → `/`.

**Dead IA (pause-first):** `/tools/*`, `/library`, old journey stats paths, etc. → **`NotFound`** (no legacy redirects). Full pre-strip map: git tag `full-ia-pre-strip` / [active-surface.md](../ops/active-surface.md).

**Catch-all:** `*` → `NotFound` (`screens/marketing/NotFoundScreen`).

---

## 5. Authentication (`src/features/auth/`, `src/hooks/use-auth.tsx` shim)

- **`AuthProvider`** (`features/auth/public.ts`) subscribes to `supabase.auth.onAuthStateChange` and seeds state from `getSession()`.
- On **`SIGNED_IN`**, if `localStorage` has `holzen_ref`, the app inserts **`referral_pending_jobs`** then invokes **`record-referral`**; **`holzen_ref`** is cleared on success or invalid code (see **`docs/systems/auth/auth-and-referral-system.md`**).
- **`useAuth()`** exposes `user`, `loading`, `signOut`.

The Supabase browser client is **`src/integrations/supabase/client.ts`** (typed with **`src/integrations/supabase/types.ts`**).

---

## 6. Data and “feature” state (where logic lives)

| Concern | Typical location |
|--------|-------------------|
| User profile, language, pause AI prefs (`reflection_style` / `reflection_tone` on `profiles`), thresholds | `use-profile.ts` + `profiles` table |
| BTC context, manual pause, companion orchestration triggers | `use-holzen.ts` |
| Companion payloads for the active pause | `use-companion-data.ts` |
| Subscription / Stripe checkout | `use-subscription.ts` |
| Library content | `use-library.ts` |
| Push (VAPID, registration) | `features/notifications/public-hooks` (`usePushNotifications`) |
| Admin metrics | `use-admin-stats.ts` |

TanStack Query is available app-wide (`QueryClient` in `App.tsx`); individual hooks may use `useEffect` + Supabase directly — follow the nearest feature.

**Architecture (truth vs projection):** [client-server-architecture-holzen.md](client-server-architecture-holzen.md) — how Postgres/RLS/edge relate to the SPA cache and UI-only state. **Folder layers:** [client-src-layout.md](client-src-layout.md).

**Shared client fetch patterns (dedupe):** subscription status is centralized in **`use-subscription.ts`** (`useQuery` so all consumers share one `check-subscription` request/cache). BTC / market reads go through **`fetchBtcData`** in **`src/lib/btc.ts`**, which coalesces concurrent calls per currency. **`use-profile.ts`** loads the signed-in **`profiles`** row via TanStack Query (`getProfileRowQueryOptions` / `PROFILE_QUERY_KEY` / `['profile', userId]`) so every **`useHolzen()`** tree shares one in-flight fetch and cache entry; **`HomeGoalWhyCard`** subscribes with the same options (no second `profiles` read for hold-goal header data). Successful **`profiles`** writes **`invalidateQueries`** that key so parallel trees refetch server truth (see [home-fetch-deduplication.md](../backlog/home-fetch-deduplication.md)).

### 6.1 TanStack Query vs `useEffect` + Supabase

Broader React norms (feature folders, colocation, scorecard): [modern-react-practices-holzen.md](modern-react-practices-holzen.md).

Both are valid. Use this to choose and to match nearby code:

| Prefer | When |
|--------|------|
| **`useQuery` / `useMutation`** | Data is **shared across routes or components**, benefits from a **stable cache key**, or needs **invalidation** after mutations (e.g. subscription status — **`use-subscription.ts`**; signed-in **`profiles`** row — **`use-profile.ts`**; blog posts — **`Blog.tsx`**, **`BlogPost.tsx`**). |
| **`useEffect` + `supabase` (or `fetch`)** | State is **owned by one hook/screen** with **no shared cache benefit**, or logic is **tightly coupled** to non-cache concerns (orchestration in **`use-holzen.ts`**, companion pipeline in **`use-companion-data.ts`**). **`use-profile.ts`** still maps the loaded row into many `useState` fields via an effect after the **`profiles`** query succeeds. |
| **Module-level coalescing** | Heavy **third-party** reads where Query is not yet adopted — **`fetchBtcData`** dedupes in-flight requests per currency without a shared query cache. |

Do **not** add global **`QueryClient` defaultOptions** lightly: they affect every future `useQuery`. Prefer explicit options on each query until team-wide defaults are agreed ([data-fetching-conventions.md](../backlog/data-fetching-conventions.md)). **Migrate opportunistically** when editing a feature, not in a standalone rewrite.

---

## 7. Screens (`src/screens/`)

**Canonical UI** lives under **`src/screens/<route>/`** ([screens/README.md](../../src/screens/README.md)). **`App.tsx`** lazy-imports `*Screen.tsx` files directly — edit the screen module, not a separate pages shim.

| Area | Screen module | Routes |
|------|---------------|--------|
| Home | `screens/home/HomeScreen.tsx` | `/` |
| Archive | `screens/archive/ArchiveScreen.tsx` | `/archive` |
| Journey | `screens/journey/JourneyOverviewScreen.tsx` | `/journey` |
| Settings | `screens/settings/*` | `/settings`, `/settings/:section`, billing, about |
| Pause | `screens/pause/PauseSessionScreen.tsx` + `components/` | `/pause` |
| Companions | `screens/pause/Companion*Page.tsx` | `/companion/*/:pauseInstanceId` |
| Marketing | `screens/marketing/*Screen.tsx` | `/welcome`, `/auth`, legal, blog, … |
| Admin / ops | `screens/admin/`, `screens/ops/` | `/admin`, smoke-test, edge-coverage, … |

Pre-strip pages (`ToolsHub`, `Library`, immersive `/tools/*`, …) live under **`src/legacy/`** — not routed in the shipped app.

---

## 8. Presentation folders (not one `components/` junk drawer)

| Folder | Role | README |
|--------|------|--------|
| `src/components/ui/` | Design system (shadcn/Radix + Holzen composites) | [components/README.md](../../src/components/README.md) |
| `src/components/icons/` | Mood / outcome glyphs (pause ritual) | same |
| `src/app/components/` | Cross-route shell (layout, nav, meta, checkout, feedback) | [app/README.md](../../src/app/README.md) |
| `src/screens/<route>/components/` | Route-specific UI | [screens/README.md](../../src/screens/README.md) |

**Rule:** no new `src/components/*.tsx` at repo root — CI `check:no-root-components`.

---

## 9. Internationalization (`src/i18n.ts`, `src/locales/`)

- Initialized with **English only** in code: `resources: { en: { translation: en } }`.
- Additional JSON files (`es`, `de`, `fr`, …) exist under `locales/` but are **commented as disabled** until imported and registered in `i18n.ts`.
- `PRICING` values from `lib/pricing.ts` are exposed as i18n default interpolation variables (e.g. `price`, `trialDays`).

---

## 10. PWA and service worker

- **`vite-plugin-pwa`** uses **inject manifest** mode with **`src/sw.ts`**.
- **`src/lib/sw-update.ts`** is loaded from `main.tsx` to listen for updates / prompt refresh.
- Workbox precaches the build; navigation uses **network-first** to reduce “stuck on old HTML” after deploys; CoinGecko has a dedicated runtime cache (see `sw.ts`).

---

## 11. Supabase: migrations

- Files in **`supabase/migrations/`** are ordered SQL changes. Apply them via your team’s workflow (CLI `db push`, dashboard, or local `npm run supabase:reset` for Docker).
- **`src/integrations/supabase/types.ts`** should stay aligned with the schema — **`npm run gen:types`** (requires Supabase CLI + `supabase login` or `SUPABASE_ACCESS_TOKEN`).

---

## 12. Supabase: edge functions

Each folder under **`supabase/functions/<name>/`** is a deployable function. Shared code: **`supabase/functions/_shared/`**.

**Invoked from the browser** (via `supabase.functions.invoke` in the current codebase):

| Function | Call sites (representative) |
|----------|-----------------------------|
| `holzen-reflect` | `use-pause-reflect-generation.ts` → `pause-reflect-artifact.ts` (`invokeEdge`) |
| `companion-orchestrate` | `use-companion-data.ts` |
| `suggest-grounding` | `Home.tsx`, `Ground.tsx` |
| `journal-prompt` | `GuidedJournal.tsx` |
| `send-feedback` | `FeedbackForm.tsx`, `OfflineBanner.tsx` |
| `generate-wallpaper` | `ReflectionWallpaper.tsx` |
| `holzen-number` | `HolzenNumber.tsx` |
| `reflection-insights` | `AIInsightsPanel.tsx` |
| `check-subscription`, `create-checkout`, `customer-portal` | `use-subscription.ts` |
| `register-push` | `features/notifications` (`usePushNotifications`) |
| `delete-account` | `Settings.tsx` |
| `badge-notify` | `use-badge-sync.ts` |
| `record-referral` | `use-auth.tsx` |

**Cron / server / webhook style** (not an exhaustive list — see `cron-setup.md` and each `index.ts`): e.g. `check-volatility`, `refresh-btc-prices`, `backfill-btc-prices` (manual `btc_price_cache` gap fill), `fetch-source-feeds`, `weekly-digest`, `deliver-letters`, `auth-email-hook`, etc.

**`supabase/config.toml`** — Each deployable function should have a **`[functions.<name>]`** block (same name as the folder under `supabase/functions/`, excluding `_shared`). This repo sets **`verify_jwt = false`** on those entries and relies on handlers to enforce auth where needed (e.g. `getUser()` with the `Authorization` header). **If you add a new function**, add its block in the **same change** so behavior is explicit.

- **Why list every function:** Supabase applies **platform defaults** for any function **not** named in `config.toml` (often **`verify_jwt = true`** at the gateway). An unlisted function can work in one environment and return **401** in another after deploy — or differ between **`npx supabase functions serve`** (reads this file) and older hosted config until redeployed.

- **What you should do:** Keep **`config.toml` in sync with `supabase/functions/*`** (one block per function). After that, local serve and hosted deploys that ship this file should agree; if you still see **401** on `invoke`, check **session / `Authorization`**, **dashboard secrets**, and that the **deployed** revision actually includes your latest `config.toml`.

- **Local vs hosted:** Both are driven by the **same committed `config.toml`** once deploys pick it up. **`npx supabase functions serve`** uses your working tree; **hosted** uses whatever was last deployed (Lovable sync, CI, or `supabase functions deploy`). Mismatch usually means **stale deploy** or a **function added without a new `config.toml` entry**.

---

## 13. Admin (`src/screens/admin/AdminScreen.tsx`)

- Route `/admin` is **protected by login** like any other `ProtectedRoute`.
- **Authorization:** `useIsAdmin` reads `profiles.is_admin` when present; if the column/query fails, it falls back to **`VITE_ADMIN_USER_IDS`** (comma-separated user UUIDs).
- UI pulls stats and tools from `use-admin-stats` and components under `components/admin/`.

---

## 14. Tests and quality gates

- **`npm run test`** — Vitest, files matching `src/**/*.{test,spec}.{ts,tsx}`.
- **`npm run test:ci`** — Runs **`check:edge-logging`**, **`check:edge-coverage-manifest`**, then Vitest with coverage + JUnit output (matches typical CI expectations).
- **`npm run check:prepush`** — Full bash preflight in **`scripts/pre-push-check.sh`** (tests, build, **`check:view-migrations`**, edge checks, optional local `supabase db reset`). **Requires `bash`** — on Windows use **Git Bash** or **WSL**. Narrative checklist: [deployment-sync-guide.md](../ops/deployment-sync-guide.md).
- **`npm run check:view-migrations`** — Blocks unsafe `CREATE OR REPLACE VIEW` column renames in **`supabase/migrations/`** (also run from **`check:prepush`**).
- **`npm run build`** — Runs **`npm run check:version-sync`** first (`prebuild`): **`package.json` `version`** must match the latest **`changelog_entries`** row for the configured Supabase project.
- **`npm run stamp:release`** — Writes the current **12-character** Git commit id into **`supabase/functions/_shared/release.ts`** (`EDGE_RELEASE`) for edge Sentry/BetterStack releases (also invoked at the start of **`check:prepush`**). See [AGENTS.md](../AGENTS.md) for the full script table.
- **Tests** — Vitest discovers `src/**/*.{test,spec}.{ts,tsx}`; co-locate unit tests with `features/` and `screens/`; use **`src/test/`** for `setup.ts`, **integration flows** (`integration/flows/`), shared **fixtures**, and cross-cutting util tests — see [client-src-layout.md](client-src-layout.md) (Testing) and [src/test/README.md](../../src/test/README.md).
- **`npm run lint`** — ESLint; the repo may have many pre-existing warnings/errors — avoid adding new ones in touched files ([AGENTS.md](../AGENTS.md)).

---

## 15. Environment modes (Vite)

| Script | Mode | Supabase env behavior (see `vite.config.ts`) |
|--------|------|-----------------------------------------------|
| `npm run dev` | `development` | Can use `.env`; **hosted fallbacks** if vars missing (`localstack` never). |
| `npm run build` | `production` (default) | Same fallbacks if vars missing; override with `.env.production` / CI / Lovable env. |
| `npm run dev:hosted` | `hosted` | Loads env for hosted backend (e.g. `.env.hosted` / `.env.hosted.local` per README). |
| `npm run dev:local` | `localstack` | **No** hosted URL/key fallback — forces explicit local Supabase values. |

---

## 16. Related documentation in `docs/`

- **[ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md)** — Manual vs automatic pause, shared pause-session AI, `companion-orchestrate`, interventions, generators, drift and ops notes.
- **[cron-setup.md](../ops/cron-setup.md)** — Scheduling edge functions (BTC refresh, feeds, digests, etc.).
- **[deployment-sync-guide.md](../ops/deployment-sync-guide.md)** — GitHub ↔ Lovable sync, pre-push checklist, **`npm run check:prepush`**, and migration/edge troubleshooting.

---

## 17. Lovable Cloud: what deploys when

If you use [Lovable](https://lovable.dev) with GitHub sync to a linked Supabase project (see [README.md](../README.md#lovable)):

| Change in repo | Typical effect on live users |
|----------------|------------------------------|
| New or updated SQL under **`supabase/migrations/`** | Migrations run against the **linked** database when the platform syncs — treat as **production** unless you use a dedicated staging project. |
| Changes under **`supabase/functions/`** | Edge functions **redeploy** on sync — same immediacy as migrations. |
| Changes under **`src/`**, `public/`, etc. | **Frontend** updates only after you **publish** and confirm **Update** in Lovable’s publish UI (not automatic the moment you push). |

**Locally**, nothing in this table runs by itself: your machine uses **`.env` / `.env.*.local`** and **`npm run dev`** (or `dev:hosted` / `dev:local`). Use **local Supabase** (`npm run supabase:start`, `supabase:reset`) to test migrations safely; use **`npx supabase functions serve`** (and [function secrets](https://supabase.com/docs/guides/functions/secrets)) to approximate hosted function behavior.

**Strategic context** (why feature branches do not protect prod DB, staging project, visible CI, leaving Lovable): [lovable-staging-and-platform-exit.md](../ops/lovable-staging-and-platform-exit.md).

---

## 18. Review notes: improvements and caveats

These are observations from a structural pass — not a full security or QA audit.

1. **Locales:** Translation files beyond English are present but not wired in `i18n.ts`. Re-enabling is a small, deliberate change (import + `resources`).

2. **ESLint debt:** Expect a large baseline of issues; scope cleanups to files you change unless you run a dedicated lint initiative.

---

## 19. Learning path: pause first, then whole app

**Once — run the app:** `cp .env.example .env`, fill Supabase URL + anon key, `npm install`, `npm run dev` (or `dev:hosted` / `dev:local` per [README.md](../README.md)), open `http://localhost:8080`, **sign in**.

If SPA/React vocabulary is still fuzzy, skim [mental-models-for-contributors.md](mental-models-for-contributors.md) first, then return here.

---

### Phase A — Pause (do this first)

Goal: one **vertical slice** you can trace in **docs → code → Network tab** without knowing the whole repo.

| Step | What to do |
|------|------------|
| 1. **Docs** | Read [ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md) **§1–2** (skim), **§4–5** (focus). Optional: [phase-2-manual-pause-pipeline.md](../reviews/phase-2-manual-pause-pipeline.md) for producer/consumer contracts. |
| 2. **Routes** | In `src/App.tsx`, find **`/pause`** → `screens/pause/PauseSessionScreen.tsx`. Trace Home → Pause layers in [client-src-layout.md](client-src-layout.md) § Reference flow. |
| 3. **Hooks** | Read in order: `screens/home/hooks/use-holzen.ts` → `screens/pause/hooks/use-pause-reflect-generation.ts` (**`holzen-reflect`** on the deep ritual **Reflect → Frame → second Breathe → Decide** window) → `screens/pause/hooks/use-companion-data.ts` (orchestrator invoke). Domain helpers remain in **`src/lib/`** and **`features/pause/`**. Open **`PauseSessionScreen.tsx`** and `screens/pause/components/` (gates, scaffold, steps). Companion favorites: pause screen hooks + `pause_instances.metadata`. |
| 4. **Edge** | In this doc **§12**, confirm **`holzen-reflect`** and **`companion-orchestrate`** invoke map. Optionally open `supabase/functions/holzen-reflect/index.ts` and `companion-orchestrate/index.ts` **headers only** (auth, entry). |
| 5. **Click + Network** | With the app running, go to **`/pause`**, run a **non-silent** manual pause, advance the **deep** ritual to **Reflect**. In DevTools **Network**, expect **`holzen-reflect`** to start around **Reflect** (the request may still be **in flight** or complete while you are on **Frame**, second **Breathe**, or **Decide**) and **`companion-orchestrate`** per the pause system doc (§4.1). |
| 6. **DB** | Skim **`supabase/migrations/`** for `profiles`, `pause_instances`, `pause_ai_artifacts` — name recognition only. |
| 7. **HTTP-only** (optional) | [bruno/README.md](../../bruno/README.md) `pause-pipeline/`: same functions in isolation; **not** a full UI substitute. |

Stop when you can explain **in one sentence** each: what **`use-holzen`** does vs what **`use-companion-data`** does, and **where** **`holzen-reflect`** runs (deep ritual: **Reflect → Frame → second Breathe → Decide** hook window in **`PauseSession`**) vs **`companion-orchestrate`**.

---

### Phase B — Whole app

Goal: **map** the rest of the surface area without drowning in files. Use **§4** (routing) and **§6–7** (hooks + screens) in *this* doc as the index.

| Step | What to do |
|------|------------|
| 1. **Route map** | Re-read **§4** above — list every **main** route (`/`, `/archive`, `/journey/*`, `/settings`, `/tools`, `/pause`, immersive `/tools/*` practices, `/admin`, public routes). For each **bucket**, note the **screen module** under `src/screens/`. |
| 2. **Auth shell** | **§5** — `use-auth`, `ProtectedRoute` / `PublicOnlyRoute`. Trace **`/welcome`** vs **`/`** once in `App.tsx`. Optional: [route-gating-system.md](../systems/routing/route-gating-system.md). |
| 3. **Feature hooks** | **§6** table — for each row you care about, open the hook and **one** page that uses it (`use-library` + `Library`, `use-subscription` + billing/settings, `use-push-notifications`, etc.). |
| 4. **Components** | **§8** — skim `components/ui/`, `app/components/`, and one `screens/<route>/components/` folder (e.g. `pause/`). |
| 5. **Edge functions** | **§12** — read the full table once; you do not need every `index.ts` until you touch a feature. [cron-setup.md](../ops/cron-setup.md) when you move to **server-triggered** pause and workers. |
| 6. **Systems docs** | [docs/README.md](../README.md) — pick **auth**, **routing**, **pause** when you need depth; phased **reviews** in order if you care about security/pipeline history. |

**Full-app click-through (optional):** same DevTools habit as Phase A — **Network** for `supabase.co` and `functions/v1` per screen; **React DevTools** if you want to see **which** component owns a route.

Welcome aboard.
