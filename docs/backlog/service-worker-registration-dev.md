# Service worker: avoid failed registration in dev

**Status:** backlog — developer experience and console noise.

## Goal

Stop **`listenForSwUpdate()`** from attempting to register **`/sw.js`** when the dev server does not serve a real worker script (or serves **HTML** with the wrong MIME type), which produces **SecurityError** / “unsupported MIME type” warnings on every local load.

## Rationale

`src/lib/sw-update.ts` registers `navigator.serviceWorker.register('/sw.js', { scope: '/' })` after boot. In **Vite dev**, unknown paths often fall through to **`index.html`**, so the “script” is HTML—registration **fails** and the console shows errors that are **not actionable** for day-to-day development. Production builds that emit **`sw.js`** correctly are unaffected.

## Direction

- **Simplest:** call `listenForSwUpdate()` only when **`import.meta.env.PROD`** (or equivalent project convention), or early-return inside `listenForSwUpdate` in dev.
- **Alternative:** serve a noop or real `sw.js` in dev via Vite config—only if we explicitly want to test SW behavior locally.
- Document the choice in a one-line comment next to the guard so future readers know why dev skips registration.

## Related

- `src/main.tsx` — dynamic import of `./lib/sw-update` and `listenForSwUpdate()`.
- [e2e-browser-automation.md](e2e-browser-automation.md) — if E2E ever asserts SW, align test env with prod vs dev behavior.
