# Route-level code splitting (lazy routes)

**Status:** backlog — performance and first-load cost.

## Goal

Load **only the code for the current route** (plus shared shell) on first paint, instead of downloading and parsing the **entire** page module graph on every cold start.

## Rationale

`src/App.tsx` uses **static imports** for every route component (`Home`, `Library`, `Admin`, `PauseSession`, etc.). As soon as the client evaluates `App`, the bundler pulls in **all** of those modules and their dependencies—even when the user is redirected to `/welcome` and never renders `Home` in that session.

In **development**, this shows up as **hundreds of Vite module requests**; in **production**, it still means **more JS than necessary** for the landing or auth-only path. This is separate from **file size** inside a page (see [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md)).

## Direction

- Replace static page imports with **`React.lazy(() => import(...))`** (or dynamic `import()` wrappers) per route.
- Add **`Suspense`** at the router level (or per-route) with an existing loading pattern (e.g. align with `AuthLoading` / skeletons where appropriate).
- **Order of work:** start with **public** routes (`/welcome`, `/auth`, marketing pages) vs **protected** shell routes to avoid a single huge PR; verify auth redirects and error boundaries still behave.
- **Measure:** compare production bundle / route chunks and first meaningful paint for `/welcome` vs `/` after login—not raw dev request counts alone.

## Related

- [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md) — splitting **internals** of large pages and hooks.
- [route-gating.md](route-gating.md) — auth loading and redirects while routes load.
- [typed-navigation-state.md](typed-navigation-state.md) — navigation payloads when touching the router.
