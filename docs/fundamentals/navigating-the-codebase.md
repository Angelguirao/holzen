# Navigating the Holzen codebase

This guide walks a new contributor through the repository in roughly the order you would discover it while running the app locally. It complements [README.md](../README.md) (setup and scripts) and [AGENTS.md](../AGENTS.md) (conventions for automation). Deep dives on the AI pause pipeline and cron jobs live in [ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md) and [cron-setup.md](../ops/cron-setup.md).

---

## 1. Orientation: what to read first

1. **[README.md](../README.md)** — Node version, `npm install`, environment files (`.env`, `.env.hosted.local`, `.env.localstack.local`), and npm scripts (`dev` on port **8080**, Supabase CLI wrappers).
2. **[AGENTS.md](../AGENTS.md)** — Where routes, pages, hooks, and Supabase artifacts live; import alias `@/` → `src/`; note on ESLint volume.
3. **[architecture/c4-holzen.md](../architecture/c4-holzen.md)** — C4 **System Context** and **Container** diagrams (and [workspace.dsl](../architecture/workspace.dsl) for Structurizr).
4. **This doc** — How those pieces connect at runtime.
5. **Optional:** [mental-models-for-contributors.md](mental-models-for-contributors.md) — SPA, React hooks, and Supabase-in-the-browser in a **backend-friendly** frame, plus suggested external links (not Holzen-specific).
6. **Refactors:** [refactoring-strategy.md](refactoring-strategy.md) — how we split large pages/hooks incrementally; backlog checklist in [react-page-and-hook-splitting.md](../backlog/react-page-and-hook-splitting.md).

---

## 2. Repository top level (mental map)

| Path | Role |
|------|------|
| `src/` | React application (TypeScript). |
| `public/` | Static assets (icons, manifest pieces, etc.). |
| `supabase/migrations/` | Postgres schema and RLS — **source of truth** for the database. |
| `supabase/functions/` | Deno edge functions (HTTP APIs, crons, webhooks). |
| `supabase/config.toml` | Supabase project id and **`[functions.<name>]`** per deployable folder — keep **one block per function** so local serve and hosted deploys match. |
| `vite.config.ts` | Dev server (port 8080), `@` alias, PWA inject-manifest, **optional Supabase URL/key fallbacks** on dev serve and `vite build` when not in `localstack` mode; **`transformIndexHtml`** injects **`preconnect`** for Supabase, Google Fonts, and CoinGecko ([resource-hints-preconnect.md](../backlog/resource-hints-preconnect.md)). |
| `vitest.config.ts` | Tests: jsdom, `src/test/setup.ts`, same `@` alias as Vite. |

---

## 3. Boot sequence: from `index.html` to first paint

1. **`index.html`** loads the Vite entry script and sets **`class="dark"`** on `<html>` so Tailwind’s `dark:` variant matches the single Nox appearance.
2. **`src/main.tsx`** is the real entry:
   - Registers global `error` / `unhandledrejection` handlers and a **crash screen** if the app fails before React mounts (clears storage + reload button).
   - Dynamically imports `App.tsx`, `lib/sw-update.ts`, and `i18n.ts`, then renders `<App />` into `#root`.
3. **`src/App.tsx`** wraps the tree in `ErrorBoundary`, `QueryClientProvider`, `TooltipProvider`, toasts, offline banner, `BrowserRouter`, and **`AuthProvider`**.

**Why it matters:** anything that throws during static import of `App` or `i18n` is caught by `main.tsx`; errors inside React use `ErrorBoundary`.

---

## 4. Routing and layout (`src/App.tsx`)

Routes are declared in one file. **Page components** under `src/pages/` are **`React.lazy`**-loaded; **`Suspense`** around **`Routes`** shows a small full-screen fallback while a chunk downloads. Two patterns matter:

- **`ProtectedRoute`** — If auth is still loading, show `AuthLoading`. If no user, redirect to `/welcome`. Otherwise render children.
- **`PublicOnlyRoute`** — Logged-in users are redirected to `/`.

**Main shell:** routes under `/`, `/library`, `/profile`, `/settings` use **`AppLayout`**: max-width column, **`<header>`** (“Holzen” + `NotificationBell`), **`<main id="main-content">`** around **`Outlet`**, and **`BottomNav`**. `AppLayout` also wires `useHolzen`, `useLanguageSync`, and `useAutoTrigger` (pause-ready banner on non-home routes).

**Full-screen / immersive routes** (no bottom nav): `/pause`, `/breathe`, `/ground`, `/ground/history`, `/ambient`, `/practice/*`, `/admin`. (`/breathe` → `Breathe.tsx`; `/ambient` → `Ambient.tsx`.)

**Redirects:** `/index` → `/`, `/history` → `/library`.

**Public pages:** `/welcome` (landing), `/auth`, `/reset-password`, `/terms`, `/privacy`, `/about`, `/blog`, `/blog/:slug`, `/roadmap`, `/reserve`.

**Catch-all:** `*` → `NotFound`.

---

## 5. Authentication (`src/hooks/use-auth.tsx`)

- **`AuthProvider`** subscribes to `supabase.auth.onAuthStateChange` and seeds state from `getSession()`.
- On **`SIGNED_IN`**, if `localStorage` has `holzen_ref`, the app inserts **`referral_pending_jobs`** then invokes **`record-referral`**; **`holzen_ref`** is cleared on success or invalid code (see **`docs/systems/auth/auth-and-referral-system.md`**).
- **`useAuth()`** exposes `user`, `loading`, `signOut`.

The Supabase browser client is **`src/integrations/supabase/client.ts`** (typed with **`src/integrations/supabase/types.ts`**).

---

## 6. Data and “feature” state (where logic lives)

| Concern | Typical location |
|--------|-------------------|
| User profile, language, reflection prefs, thresholds | `use-profile.ts` + `profiles` table |
| BTC context, manual pause, reflection + companion orchestration trigger | `use-holzen.ts` |
| Companion payloads after a reflection | `use-companion-data.ts` |
| Subscription / Stripe checkout | `use-subscription.ts` |
| Library content | `use-library.ts` |
| Push (VAPID, registration) | `use-push-notifications.ts` |
| Admin metrics | `use-admin-stats.ts` |

TanStack Query is available app-wide (`QueryClient` in `App.tsx`); individual hooks may use `useEffect` + Supabase directly — follow the nearest feature.

**Shared client fetch patterns (dedupe):** subscription status is centralized in **`use-subscription.ts`** (`useQuery` so all consumers share one `check-subscription` request/cache). BTC / market reads go through **`fetchBtcData`** in **`src/lib/btc.ts`**, which coalesces concurrent calls per currency. Profile row loading remains **`use-profile.ts`** (stable **`user?.id`** dependency); if DevTools still shows duplicate `profiles` requests, consider a single layout-level query (see [home-fetch-deduplication.md](../backlog/home-fetch-deduplication.md)).

### 6.1 TanStack Query vs `useEffect` + Supabase

Both are valid. Use this to choose and to match nearby code:

| Prefer | When |
|--------|------|
| **`useQuery` / `useMutation`** | Data is **shared across routes or components**, benefits from a **stable cache key**, or needs **invalidation** after mutations (e.g. subscription status — **`use-subscription.ts`**; blog posts — **`Blog.tsx`**, **`BlogPost.tsx`**). |
| **`useEffect` + `supabase` (or `fetch`)** | State is **owned by one hook/screen**, **many follow-up setters** run off one load (e.g. **`use-profile.ts`** seeding dozens of fields), or logic is **tightly coupled** to non-cache concerns (orchestration in **`use-holzen.ts`**, companion pipeline in **`use-companion-data.ts`**). |
| **Module-level coalescing** | Heavy **third-party** reads where Query is not yet adopted — **`fetchBtcData`** dedupes in-flight requests per currency without a shared query cache. |

Do **not** add global **`QueryClient` defaultOptions** lightly: they affect every future `useQuery`. Prefer explicit options on each query until team-wide defaults are agreed ([data-fetching-conventions.md](../backlog/data-fetching-conventions.md)). **Migrate opportunistically** when editing a feature, not in a standalone rewrite.

---

## 7. Pages (`src/pages/`) — grouped by domain

- **Core app:** `Home`, `Library`, `Profile`, `Settings`.
- **Auth / legal / marketing:** `Landing`, `Auth`, `ResetPassword`, `Terms`, `Privacy`, `About`, `Blog`, `BlogPost`, `Roadmap`, `Reserve`.
- **Practices:** `PauseSession`, `Breathe`, `Ground`, `GroundHistory`, `PracticeCheckIn`, `PracticeJournal`, `PracticeBodyScan`, `PracticeReplay`, `Ambient`.
- **`/ambient` vs `/breathe`:** `Ambient.tsx` is the full-screen volatility-gradient breathing screen; **`App.tsx` routes `/ambient` to `<Ambient />`**. `/breathe` uses `Breathe.tsx` (a different flow).
- **Ops:** `Admin` (see below).
- **Errors:** `NotFound`.

---

## 8. Components (`src/components/`)

- **`ui/`** — shadcn/Radix-style primitives (buttons, dialogs, forms, etc.). Reuse these before adding one-off styled divs.
- **Feature folders** — e.g. `practice/`, `onboarding/`, `pause/`, `admin/`.
- **Cross-cutting:** `AppLayout`, `BottomNav`, `ErrorBoundary`, `OfflineBanner`, `CookieConsent`, `NotificationBell`, companion and intervention UI, etc.

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
| `holzen-reflect` | `use-holzen.ts` |
| `companion-orchestrate` | `use-companion-data.ts` |
| `suggest-grounding` | `Home.tsx`, `Ground.tsx` |
| `journal-prompt` | `GuidedJournal.tsx` |
| `send-feedback` | `FeedbackForm.tsx`, `OfflineBanner.tsx` |
| `generate-wallpaper` | `ReflectionWallpaper.tsx` |
| `holzen-number` | `HolzenNumber.tsx` |
| `reflection-insights` | `AIInsightsPanel.tsx` |
| `check-subscription`, `create-checkout`, `customer-portal` | `use-subscription.ts` |
| `register-push` | `use-push-notifications.ts` |
| `delete-account` | `Settings.tsx` |
| `badge-notify` | `use-badge-sync.ts` |
| `record-referral` | `use-auth.tsx` |

**Cron / server / webhook style** (not an exhaustive list — see `cron-setup.md` and each `index.ts`): e.g. `check-volatility`, `refresh-btc-prices`, `backfill-btc-prices` (manual `btc_price_cache` gap fill), `fetch-source-feeds`, `weekly-digest`, `deliver-letters`, `auth-email-hook`, etc.

**`supabase/config.toml`** — Each deployable function should have a **`[functions.<name>]`** block (same name as the folder under `supabase/functions/`, excluding `_shared`). This repo sets **`verify_jwt = false`** on those entries and relies on handlers to enforce auth where needed (e.g. `getUser()` with the `Authorization` header). **If you add a new function**, add its block in the **same change** so behavior is explicit.

- **Why list every function:** Supabase applies **platform defaults** for any function **not** named in `config.toml` (often **`verify_jwt = true`** at the gateway). An unlisted function can work in one environment and return **401** in another after deploy — or differ between **`npx supabase functions serve`** (reads this file) and older hosted config until redeployed.

- **What you should do:** Keep **`config.toml` in sync with `supabase/functions/*`** (one block per function). After that, local serve and hosted deploys that ship this file should agree; if you still see **401** on `invoke`, check **session / `Authorization`**, **dashboard secrets**, and that the **deployed** revision actually includes your latest `config.toml`.

- **Local vs hosted:** Both are driven by the **same committed `config.toml`** once deploys pick it up. **`npx supabase functions serve`** uses your working tree; **hosted** uses whatever was last deployed (Lovable sync, CI, or `supabase functions deploy`). Mismatch usually means **stale deploy** or a **function added without a new `config.toml` entry**.

---

## 13. Admin (`src/pages/Admin.tsx`)

- Route `/admin` is **protected by login** like any other `ProtectedRoute`.
- **Authorization:** `useIsAdmin` reads `profiles.is_admin` when present; if the column/query fails, it falls back to **`VITE_ADMIN_USER_IDS`** (comma-separated user UUIDs).
- UI pulls stats and tools from `use-admin-stats` and components under `components/admin/`.

---

## 14. Tests and quality gates

- **`npm run test`** — Vitest, files matching `src/**/*.{test,spec}.{ts,tsx}`.
- **`src/test/`** — `setup.ts` plus tests for sanitization, fallbacks, companion types, etc.
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

- **[ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md)** — Manual vs automatic pause, shared reflection AI, `companion-orchestrate`, interventions, generators, drift and ops notes.
- **[cron-setup.md](../ops/cron-setup.md)** — Scheduling edge functions (BTC refresh, feeds, digests, etc.).

---

## 17. Lovable Cloud: what deploys when

If you use [Lovable](https://lovable.dev) with GitHub sync to a linked Supabase project (see [README.md](../README.md#Lovable)):

| Change in repo | Typical effect on live users |
|----------------|------------------------------|
| New or updated SQL under **`supabase/migrations/`** | Migrations run against the **linked** database when the platform syncs — treat as **production** unless you use a dedicated staging project. |
| Changes under **`supabase/functions/`** | Edge functions **redeploy** on sync — same immediacy as migrations. |
| Changes under **`src/`**, `public/`, etc. | **Frontend** updates only after you **publish** and confirm **Update** in Lovable’s publish UI (not automatic the moment you push). |

**Locally**, nothing in this table runs by itself: your machine uses **`.env` / `.env.*.local`** and **`npm run dev`** (or `dev:hosted` / `dev:local`). Use **local Supabase** (`npm run supabase:start`, `supabase:reset`) to test migrations safely; use **`npx supabase functions serve`** (and [function secrets](https://supabase.com/docs/guides/functions/secrets)) to approximate hosted function behavior.

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
| 2. **Routes** | In `src/App.tsx`, find **`/pause`** → `PauseSession`. Note how **`Home`** also ties to pause (hooks, navigation). |
| 3. **Hooks** | Read in order: `src/hooks/use-holzen.ts` (`manualTrigger` → `generateMessage`) → `src/hooks/use-companion-data.ts` (orchestrator invoke). Bounded **`use-holzen`** helpers live in **`src/lib/`**: `reflection-persist-error`, `holzen-manual-cooldown`, `pause-context-from-btc`, `btc-move-severity`, `next-cron-quarter`. **`use-companion-data`** pulls types/cache/mood/source-catalog/recency/library-autosave/completion helpers from **`companion-orchestrate-types`**, **`companion-reflection-cache`**, **`companion-mood-history`**, **`companion-orchestrate-sources`**, **`companion-recency-hints`**, **`companion-library-autosave`**, **`companion-completion-sync`**, **`companion-completion-maps`**, **`companion-orchestrate-slot-apply`**, **`companion-url`**. Open `src/pages/PauseSession.tsx` (hydration + steps); persistence in `pause-session-storage.ts`, gates in `PauseSessionGate`, shell in `PauseSessionScaffold`. Companion **`library_items`** favorites: `use-companion-library-favorites.ts`. |
| 4. **Edge** | In this doc **§12**, confirm **`holzen-reflect`** and **`companion-orchestrate`** invoke map. Optionally open `supabase/functions/holzen-reflect/index.ts` and `companion-orchestrate/index.ts` **headers only** (auth, entry). |
| 5. **Click + Network** | With the app running, go to **`/pause`**, run a **non-silent** manual pause. In DevTools **Network**, filter for **`holzen-reflect`** and **`companion-orchestrate`** — order should match **§4.1** in the pause system doc. |
| 6. **DB** | Skim **`supabase/migrations/`** for `profiles`, `pause_instances`, `pause_ai_artifacts` — name recognition only. |
| 7. **HTTP-only** (optional) | [bruno/README.md](../../bruno/README.md) `pause-pipeline/`: same functions in isolation; **not** a full UI substitute. |

Stop when you can explain **in one sentence** each: what **`use-holzen`** does vs what **`use-companion-data`** does, and **where** `holzen-reflect` vs `companion-orchestrate` run.

---

### Phase B — Whole app

Goal: **map** the rest of the surface area without drowning in files. Use **§4** (routing) and **§6–7** (hooks + pages) in *this* doc as the index.

| Step | What to do |
|------|------------|
| 1. **Route map** | Re-read **§4** above — list every **main** route (`/`, `/library`, `/profile`, `/settings`, `/pause`, practices, `/admin`, public routes). For each **bucket**, note the **page file** under `src/pages/`. |
| 2. **Auth shell** | **§5** — `use-auth`, `ProtectedRoute` / `PublicOnlyRoute`. Trace **`/welcome`** vs **`/`** once in `App.tsx`. Optional: [route-gating-system.md](../systems/routing/route-gating-system.md). |
| 3. **Feature hooks** | **§6** table — for each row you care about, open the hook and **one** page that uses it (`use-library` + `Library`, `use-subscription` + billing/settings, `use-push-notifications`, etc.). |
| 4. **Components** | **§8** — skim `src/components/ui/` (primitives) vs feature folders (`pause/`, `practice/`, …). |
| 5. **Edge functions** | **§12** — read the full table once; you do not need every `index.ts` until you touch a feature. [cron-setup.md](../ops/cron-setup.md) when you move to **server-triggered** pause and workers. |
| 6. **Systems docs** | [docs/README.md](../README.md) — pick **auth**, **routing**, **pause** when you need depth; phased **reviews** in order if you care about security/pipeline history. |

**Full-app click-through (optional):** same DevTools habit as Phase A — **Network** for `supabase.co` and `functions/v1` per screen; **React DevTools** if you want to see **which** component owns a route.

Welcome aboard.
