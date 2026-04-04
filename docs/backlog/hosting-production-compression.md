# Hosting: verify HTML compression in production

**Status:** shipped (2026-04) — **verification procedure** documented; sample check against current Lovable/Cloudflare stack.

## Expectations

| Environment | `text/html` compression |
|-------------|------------------------|
| **Vite dev** (`localhost:8080`) | Often **none** — normal; Lighthouse may report “compression: failed” for the document. |
| **Production** (CDN / edge) | Expect **`Content-Encoding: gzip`** or **`br`** (Brotli) on the **200** HTML response. |

## How to verify (any deploy)

1. **curl** (follow redirects):

   ```bash
   curl -sIL -H "Accept-Encoding: gzip, br, deflate" "https://YOUR_ORIGIN/"
   ```

   Inspect the **last** `HTTP/1.1 200` (or `HTTP/2 200`) block for **`content-encoding:`** (case-insensitive).

2. **Chrome DevTools** → **Network** → select the **document** row → **Headers** → **Response Headers** → **`content-encoding`**.

3. If **`content-encoding`** is missing for HTML in production, enable compression at the **CDN or host** (not only for `*.js` / `*.css`).

## Sample check (2026-04-04)

Against **`https://holzen.lovable.app/`** (unauthenticated **`curl`**): the origin returns **302** to Lovable **auth-bridge**; the **200** HTML response on that chain was served with **`Content-Encoding: gzip`** (**Cloudflare**). Authenticated or custom domains should be re-checked after deploy changes.

## Related

- [reports/2026-04-03-home-localhost-360-analysis.md](../reports/2026-04-03-home-localhost-360-analysis.md) — dev trace context.
