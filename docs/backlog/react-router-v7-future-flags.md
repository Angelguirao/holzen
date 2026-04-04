# React Router: opt into v7 future flags

**Status:** done (2026-04).

## What shipped

- **`src/App.tsx`:** `BrowserRouter` now passes `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` (react-router-dom ^6.30).

## Verify

- Smoke **`/`**, **`/welcome`**, **`/pause`**, **`/blog/:slug`** after deploy.
