# App shell (`src/app/`)

Cross-route chrome and providers: layout, bottom nav, document meta, error boundary, offline/cookie banners, public marketing footer.

**Screens** (`src/screens/<route>/`) own tab-specific UI and orchestration. **Features** (`src/features/*`) own domain truth.

| Path | Role |
|------|------|
| `components/AppLayout.tsx` | Authenticated shell (header, outlet, bottom nav) |
| `components/BottomNav.tsx` | Primary tab navigation |
| `components/PageMeta.tsx` | Title / SEO / robots |
| `components/PageHeading.tsx` | Marketing / settings page titles |
| `components/ErrorBoundary.tsx` | React error boundary + feedback hook |
| `components/OfflineBanner.tsx` | Network offline indicator |
| `components/CookieConsent.tsx` | Cookie banner |
| `components/PublicFooter.tsx` | Public page footer |
| `components/NotificationBell.tsx` | Header notifications |
| `components/PauseReadyBanner.tsx` | Pause-ready promo strip |
| `components/CheckoutConfirmation.tsx` | Stripe return / checkout modal |
| `components/PaywallSubscribedTracker.tsx` | Post-subscribe analytics |
| `components/AuthLoading.tsx` | Auth bootstrap spinner |
| `components/AppVersionBadge.tsx` | Build version display |
| `components/FeedbackWidget.tsx` | Global feedback sheet (bug / feature / question) |
| `components/HoldGoalWidget.tsx` | Hold goal editor (Home + Settings) |
| `components/ProLock.tsx` | Pro feature gate wrapper |
| `components/SubscriptionSkeleton.tsx` | Subscription loading placeholders |
| `components/QuietWindowsManager.tsx` | Quiet hours UI (Settings) |
| `components/ThresholdSetting.tsx` | BTC threshold control (Settings) |

| `hooks/use-is-admin.ts` | Client admin gate for `/admin` and internal ops pages |

Settings orchestration: `src/screens/settings/hooks/`, `SettingsStateLayout.tsx`.

See [frontend-module-layout.md](../../docs/fundamentals/frontend-module-layout.md) wave **5j**.
