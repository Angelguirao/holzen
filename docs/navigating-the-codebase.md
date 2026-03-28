# Navigating the Holzen codebase

This guide walks a new contributor through the repository in roughly the order you would discover it while running the app locally. It complements [README.md](../README.md) (setup and scripts) and [AGENTS.md](../AGENTS.md) (conventions for automation). Deep dives on the AI pause pipeline and cron jobs live in [ai-powered-pause-system.md](./ai-powered-pause-system.md) and [cron-setup.md](./cron-setup.md).

---

## 1. Orientation: what to read first

1. **[README.md](../README.md)** — Node version, `npm install`, environment files (`.env`, `.env.hosted.local`, `.env.localstack.local`), and npm scripts (`dev` on port **8080**, Supabase CLI wrappers).
2. **[AGENTS.md](../AGENTS.md)** — Where routes, pages, hooks, and Supabase artifacts live; import alias `@/` → `src/`; note on ESLint volume.
3. **This doc** — How those pieces connect at runtime.

---

## 2. Repository top level (mental map)

| Path | Role |
|------|------|
| `src/` | React application (TypeScript). |
| `public/` | Static assets (icons, manifest pieces, etc.). |
| `supabase/migrations/` | Postgres schema and RLS — **source of truth** for the database. |
| `supabase/functions/` | Deno edge functions (HTTP APIs, crons, webhooks). |
| `supabase/config.toml` | Supabase project id and **`[functions.<name>]`** per deployable folder — keep **one block per function** so local serve and hosted deploys match. |
| `vite.config.ts` | Dev server (port 8080), `@` alias, PWA inject-manifest, **optional Supabase URL/key fallbacks** when not in `localstack` mode. |
| `vitest.config.ts` | Tests: jsdom, `src/test/setup.ts`, same `@` alias as Vite. |

---

## 3. Boot sequence: from `index.html` to first paint

1. **`index.html`** loads the Vite entry script (default Vite layout).
2. **`src/main.tsx`** is the real entry:
   - Registers global `error` / `unhandledrejection` handlers and a **crash screen** if the app fails before React mounts (clears storage + reload button).
   - Dynamically imports `App.tsx`, `lib/sw-update.ts`, and `i18n.ts`, then renders `<App />` into `#root`.
3. **`src/App.tsx`** wraps the tree in `ErrorBoundary`, `ThemeProvider` (next-themes), `QueryClientProvider`, `TooltipProvider`, toasts, offline banner, `BrowserRouter`, and **`AuthProvider`**.

**Why it matters:** anything that throws during static import of `App` or `i18n` is caught by `main.tsx`; errors inside React use `ErrorBoundary`.

---

## 4. Routing and layout (`src/App.tsx`)

Routes are declared in one file. Two patterns matter:

- **`ProtectedRoute`** — If auth is still loading, show `AuthLoading`. If no user, redirect to `/welcome`. Otherwise render children.
- **`PublicOnlyRoute`** — Logged-in users are redirected to `/`.

**Main shell:** routes under `/`, `/library`, `/profile`, `/settings` use **`AppLayout`**: max-width column, header (“Holzen” + `NotificationBell`), `Outlet`, and **`BottomNav`**. `AppLayout` also wires `useHolzen`, `useLanguageSync`, and `useAutoTrigger` (pause-ready banner on non-home routes).

**Full-screen / immersive routes** (no bottom nav): `/pause`, `/breathe`, `/ground`, `/ground/history`, `/ambient`, `/practice/*`, `/admin`. (`/breathe` → `Breathe.tsx`; `/ambient` → `Ambient.tsx`.)

**Redirects:** `/index` → `/`, `/history` → `/library`.

**Public pages:** `/welcome` (landing), `/auth`, `/reset-password`, `/terms`, `/privacy`, `/about`, `/blog`, `/blog/:slug`, `/roadmap`, `/reserve`.

**Catch-all:** `*` → `NotFound`.

---

## 5. Authentication (`src/hooks/use-auth.tsx`)

- **`AuthProvider`** subscribes to `supabase.auth.onAuthStateChange` and seeds state from `getSession()`.
- On **`SIGNED_IN`**, if `localStorage` has `holzen_ref`, it is consumed and **`record-referral`** is invoked (fire-and-forget).
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
- **`src/integrations/supabase/types.ts`** should stay aligned with the schema (regenerate when the schema changes, per your usual Supabase typing workflow).

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

**Cron / server / webhook style** (not an exhaustive list — see `cron-setup.md` and each `index.ts`): e.g. `check-volatility`, `refresh-btc-prices`, `fetch-source-feeds`, `weekly-digest`, `deliver-letters`, `auth-email-hook`, etc.

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
| `npm run dev` | `development` | Can use `.env`; dev server may use **hosted fallbacks** if vars missing (`localstack` mode never does). |
| `npm run dev:hosted` | `hosted` | Loads env for hosted backend (e.g. `.env.hosted` / `.env.hosted.local` per README). |
| `npm run dev:local` | `localstack` | **No** hosted URL/key fallback — forces explicit local Supabase values. |

---

## 16. Related documentation in `docs/`

- **[ai-powered-pause-system.md](./ai-powered-pause-system.md)** — Manual vs automatic pause, shared reflection AI, `companion-orchestrate`, interventions, generators, drift and ops notes.
- **[cron-setup.md](./cron-setup.md)** — Scheduling edge functions (BTC refresh, feeds, digests, etc.).

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

## 19. Suggested “first day” exercise

1. `cp .env.example .env`, fill Supabase URL + anon key, `npm install`, `npm run dev`, open `http://localhost:8080`.
2. Trace **`/` → `Home` → `useHolzen` / `use-profile`** and one Supabase table read.
3. Sign in, trigger **Pause** (`/pause`) and follow **`use-holzen`** → `holzen-reflect` then **`use-companion-data`** → `companion-orchestrate`.
4. Skim **`supabase/migrations/`** for `profiles`, `reflections`, and RLS policy names you see in the app.
5. Read **[ai-powered-pause-system.md](./ai-powered-pause-system.md)** if you touch pause, companions, or volatility.

Welcome aboard.
