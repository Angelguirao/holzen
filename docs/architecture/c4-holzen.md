# Holzen — C4 architecture

**Last updated:** 2026-05-26

[C4](https://c4model.com/) describes software with hierarchical diagrams. This repo maintains **System Context** and **Container** views. Deeper levels (components, code) stay in feature docs and source layout.

**Rendering:** Diagrams use [Mermaid C4 syntax](https://mermaid.js.org/syntax/c4.html). They render in editors and sites that bundle a recent Mermaid build with C4 enabled. If a viewer strips C4, use [Mermaid Live](https://mermaid.live) or open [workspace.dsl](workspace.dsl) in [Structurizr Lite](https://structurizr.com/help/lite).

---

## Level 1 — System context

Who uses Holzen, and which external systems it depends on.

```mermaid
C4Context
title System context — Holzen

Person(user, "Holzen user", "Uses mindfulness, pause, library, and companions in the browser.")

System(holzen, "Holzen", "Bitcoin-aware mindfulness: SPA plus serverless APIs and data.")

System_Ext(supabase, "Supabase", "Postgres, Row Level Security, Auth, Edge Function runtime, storage.")
System_Ext(stripe, "Stripe", "Checkout, subscriptions, customer portal; webhooks to Holzen.")
System_Ext(ai, "AI & search providers", "Model APIs and web search used for companions (e.g. pause orchestration, Signal).")
System_Ext(email, "Resend", "Transactional email from edge functions (auth hook, pause offers, digests).")
System_Ext(push, "Web push infrastructure", "VAPID and delivery for notifications.")

Rel(user, holzen, "Uses", "HTTPS")
Rel(holzen, supabase, "Auth, data, invokes functions", "HTTPS / WSS")
Rel(holzen, stripe, "Checkout & billing UX", "HTTPS redirect + APIs")
Rel(holzen, ai, "Companion generation", "HTTPS (server-side only)")
Rel(holzen, email, "Sends mail", "HTTPS")
Rel(holzen, push, "Registers and sends push", "HTTPS")

UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

**Notes**

- The **browser** is the user’s environment; the **Holzen** system is the product you ship (SPA + Deno functions + schema), not the Supabase product itself.
- **AI & search** are intentionally one box at this level; companion detail is in [companions/signal.md](../systems/pause/companions/signal.md) and the pause system doc.

---

## Level 2 — Containers

Major runnable / deployable pieces inside Holzen and how they connect to Supabase and third parties.

```mermaid
C4Container
title Container diagram — Holzen

Person(user, "Holzen user", "Uses the app in a web browser.")

System_Boundary(holzen, "Holzen") {
    Container(spa, "Web application", "React, TypeScript, Vite", "UI, routing, auth session, TanStack Query, PWA.")
    Container(edge, "Edge functions", "Deno (TypeScript)", "HTTP APIs: reflection, companions, Stripe, notifications, cron webhooks, shared `_shared/` libraries.")
}

System_Ext(supabase, "Supabase platform", "Postgres + Auth + hosts Edge Functions + secrets.")
System_Ext(stripe, "Stripe", "Payments.")
System_Ext(ai, "AI & search APIs", "External models and Perplexity-style search for companions.")
System_Ext(email, "Email API", "Transactional sends.")
System_Ext(push, "Push services", "Browser push delivery.")

Rel(user, spa, "Uses", "HTTPS")
Rel(spa, supabase, "Sign-in, RLS queries, storage, invokes edge functions", "HTTPS / WSS")
Rel(edge, supabase, "Service-role DB access, Auth verification, secrets", "HTTPS")
Rel(spa, stripe, "Hosted checkout / portal", "HTTPS")
Rel(edge, stripe, "Webhooks, subscription API", "HTTPS")
Rel(edge, ai, "Companion and reflection generation", "HTTPS")
Rel(edge, email, "Sends email", "HTTPS")
Rel(edge, push, "Push-related operations", "HTTPS")

UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

**Notes**

- **Edge functions** map to `supabase/functions/*`; each deployable function is a **unit** of work, but C4 treats them as one **container** unless you split diagrams for operations.
- The SPA **never** holds service-role keys; privileged work stays in **edge** with dashboard secrets.

---

## Level 2b — Planned container (browser extension)

**Not shipped.** Documented so C4 stays aligned with [behavioral-platform-strategy.md](../fundamentals/behavioral-platform-strategy.md) and ADR [2026-05-26-browser-extension-plasmo.md](../decisions/2026-05-26-browser-extension-plasmo.md). Merge into the main container diagram when `apps/extension` exists.

```mermaid
C4Container
title Planned — browser extension container

Person(user, "Holzen user", "Checks markets on third-party sites.")

System_Boundary(holzen, "Holzen") {
    Container(spa, "Web application", "React, Vite", "Pause ritual, auth, subscription — shipped.")
    Container(ext, "Browser extension", "Plasmo, React, TS", "Content scripts, overlays, check-burst telemetry on allowlisted market domains.")
    Container(edge, "Edge functions", "Deno", "Unchanged — reflection, companions, Stripe, cron.")
}

System_Ext(market_sites, "Market websites", "CoinMarketCap, TradingView, exchanges — not owned by Holzen.")
System_Ext(supabase, "Supabase", "Auth, Postgres, hosts edge.")

Rel(user, spa, "Full pause ritual", "HTTPS")
Rel(user, market_sites, "Price checking", "HTTPS")
Rel(ext, market_sites, "Observes + injects overlay", "Content scripts")
Rel(user, ext, "Installs", "Web store")
Rel(ext, supabase, "Session, optional telemetry/events", "HTTPS")
Rel(ext, spa, "Deep link to /pause", "HTTPS")
Rel(spa, supabase, "RLS, invoke edge", "HTTPS")
Rel(edge, supabase, "Service role, secrets", "HTTPS")
```

**Notes**

- Extension **does not** replace the SPA container; it adds **cross-origin behavioral signals** and lightweight interventions.
- Prefer **PostHog** for extension funnel events (`surface: extension`); Postgres only if server-side aggregation is required (see backlog ticket).

---

## Related documentation

- [navigating-the-codebase.md](../fundamentals/navigating-the-codebase.md) — repo map and boot flow  
- [behavioral-platform-strategy.md](../fundamentals/behavioral-platform-strategy.md) — planned browser extension container (§Level 2b in c4-holzen.md)
- [ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md) — pause and companion pipeline  
- [AGENTS.md](../../AGENTS.md) — paths and conventions for automation  
- [cron-setup.md](../ops/cron-setup.md) — scheduled jobs calling edge functions  

---

## Machine-readable model

The same relationships are expressed in [workspace.dsl](workspace.dsl) for Structurizr tooling and optional PNG/SVG export via the Structurizr CLI.
