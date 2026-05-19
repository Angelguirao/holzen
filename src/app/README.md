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

See [frontend-module-layout.md](../../docs/fundamentals/frontend-module-layout.md) wave **5j**.
