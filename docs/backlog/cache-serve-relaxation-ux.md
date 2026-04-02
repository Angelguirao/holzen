# Cache serve: relaxation transparency (Pending)

## Context (from Phase 5)

`serveFromCache` in `supabase/functions/_shared/cache.ts` **progressively relaxes** constraints when no unseen high-quality entry exists: it may serve **lower quality**, **already-seen**, or **any** cache rows to avoid **empty** companion slots.

## Current problem

Users may not **know** they are seeing a **fallback** (repeat, lower quality) versus a **fresh** high-quality cache hit — indistinguishable in UI if not surfaced.

## Implications if we leave it as-is

- Acceptable for many products; some users may perceive "repetitive" or "off" content without explanation.

## Proposed improvement (optional product)

- **Telemetry-only**: log relaxation tier for analytics (no UI change).
- **Light UI**: subtle copy or badge when serving from relaxed tier (if product wants transparency).
- **Stricter mode**: user setting "fewer repeats, allow empty" — major behavior change; validate demand first.

## Related code pointers

- `supabase/functions/_shared/cache.ts` — `serveFromCache`
- Client companion cards — whether they can show a hint

## Acceptance criteria / how to verify

1. Product decision: **silent** vs **visible** fallback vs **stricter** cache-only mode.
2. If visible, copy and accessibility reviewed.
