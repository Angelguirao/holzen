# Service worker: avoid failed registration in dev

**Status:** done (2026-04).

## What shipped

- **`src/lib/sw-update.ts`:** `listenForSwUpdate()` returns immediately when **`import.meta.env.DEV`** so local dev does not register `/sw.js` (Vite would return HTML, not a worker script).

Production / preview builds with a real **`sw.js`** are unchanged.

## Related

- `src/main.tsx` — still calls `listenForSwUpdate()` after boot; no-op in dev.
