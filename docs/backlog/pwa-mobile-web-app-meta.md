# PWA: `mobile-web-app-capable` meta

**Status:** backlog — one-line HTML / manifest hygiene.

## Goal

Address Chrome’s deprecation warning for **`<meta name="apple-mobile-web-app-capable" content="yes">`** by also including **`<meta name="mobile-web-app-capable" content="yes">`** (see browser guidance in the console warning).

## Rationale

Harmless for behavior today; aligns with **progressive web app** metadata expectations and quiets DevTools noise during audits.

## Direction

- Add the meta tag wherever the PWA shell is defined (likely **`index.html`** or a shared layout head component).
- Re-check **Issues** / console on a cold load.

## Related

- [service-worker-registration-dev.md](service-worker-registration-dev.md) — other PWA / SW surface in dev vs prod.
