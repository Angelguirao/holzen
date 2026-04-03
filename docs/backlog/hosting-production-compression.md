# Hosting: verify HTML compression in production

**Status:** backlog — one-time **ops / hosting** check.

## Goal

Confirm **production** responses for **`text/html`** use **gzip** or **Brotli** (and that CDN/host headers match expectations).

## Rationale

The **DocumentLatency** insight reported **compression: failed** for `http://localhost:8080/` — expected for **Vite dev**. Production should still be verified; many static hosts enable compression by default.

## Direction

- After deploy, check response headers for **`Content-Encoding`** on the main document (or use Lighthouse / curl against the live origin).
- If missing, enable compression at the **CDN** or **edge** (not only static assets).

## Related

- [reports/2026-04-03-home-localhost-360-analysis.md](../reports/2026-04-03-home-localhost-360-analysis.md) — dev trace context.
