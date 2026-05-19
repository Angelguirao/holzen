# App shell (`src/app/`)

Cross-route chrome and providers: layout, bottom nav, document meta, error boundary, offline/cookie banners, global feedback.

**Screens** (`src/screens/<route>/`) own tab-specific UI. **Features** (`src/features/*`) own domain truth and shell-mounted presentation re-exported via `public.ts`.

**Canonical:** [client-src-layout.md](../../docs/fundamentals/client-src-layout.md), [frontend-module-layout.md](../../docs/fundamentals/frontend-module-layout.md) wave **5j**.

## Related folders

| Folder | Role |
|--------|------|
| `src/screens/<route>/` | Route-scoped UI — [screens/README.md](../screens/README.md) |
| `src/components/ui/` | Design system — [components/README.md](../components/README.md) |
| `src/features/*` | Domain + presentation mounted from shell — [features/README.md](../features/README.md) |

## Components in this folder

| Path | Role |
|------|------|
| `components/AppLayout.tsx` | Authenticated shell (header, outlet, bottom nav); composes subscription/user/pause chrome |
| `components/BottomNav.tsx` | Primary tab navigation |
| `components/PageMeta.tsx` | Per-route title / SEO / robots (imported by screens; head shell API) |
| `components/ErrorBoundary.tsx` | React error boundary + Sentry feedback hook |
| `components/OfflineBanner.tsx` | Network offline indicator |
| `components/CookieConsent.tsx` | Cookie banner |
| `components/PauseReadyBanner.tsx` | Cross-tab “pause ready” strip (non-Home) |
| `components/AuthLoading.tsx` | Auth bootstrap spinner (router gates) |
| `components/FeedbackWidget.tsx` | Global error-report sheet (signed-in) |
| `components/ShellPauseChrome.tsx` | Pending pause offer + pause-ready banner (`useHolzen` isolated here) |

| `hooks/use-is-admin.ts` | Client admin gate for `/admin` and ops pages |
| `hooks/use-shell-profile.ts` | Profile load error + i18n for shell (no `useHolzen`) |

## Placement rationale (what lives elsewhere)

| UI | Location | Mount / import | Why not `app/components/`? |
|----|----------|----------------|----------------------------|
| `PublicFooter` | `screens/marketing/components/` | Marketing screens only | Public route footer, not app-root chrome |
| `CheckoutConfirmation`, `PaywallSubscribedTracker` | `features/subscription/presentation/` | `AppLayout` via `@/features/subscription/public` | Subscription domain; shell only mounts globally for Stripe return on any tab |
| `NotificationBell` | `features/user/presentation/` | `AppLayout` via `@/features/user/public` | Inbox logic + Supabase; header slot is shell |
| `PageHeading`, `ProLock` | `components/ui/` | Many routes | Shared presentation primitives |
| `HoldGoalWidget`, `InstallHolzenCard`, `SubscriptionSkeleton`, `ThresholdFrequencyEstimator` | `screens/home/components/` | Home (+ Settings composes some) | Home/settings product UI, not shell |
| `ThresholdSetting`, `QuietWindowsManager`, `AppVersionBadge` | `screens/settings/components/` | Settings | User prefs content |

**`AppLayout` orchestration:** `useShellProfile` + `useAutoTrigger` (outlet context for Home), `ShellPauseChrome` (pause modal/banner), subscription checkout trackers, `NotificationBell` — see docblock in `AppLayout.tsx`.

## Navigation cheat sheet

| I need… | Start here |
|---------|------------|
| Tab / route UI | `screens/<route>/` |
| Bottom nav, global banners, meta, feedback | `app/components/` |
| Checkout modal / subscribe analytics | `features/subscription/public` (mounted in `AppLayout`) |
| Notification inbox | `features/user/public` (mounted in `AppLayout`) |
| Marketing footer | `screens/marketing/components/PublicFooter` |
| Primitives (`PageHeading`, `ProLock`, …) | `components/ui/` |
| Route wiring | `src/pages/` + `App.tsx` |
