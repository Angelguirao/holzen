# Architecture (C4)

This folder holds **C4-style** views of Holzen: **System Context** and **Container** diagrams (external systems and deployables). They complement:

- [client-src-layout.md](../fundamentals/client-src-layout.md) — **inside the SPA**: `app` / `screens` / `components` / `features` folders
- [navigating-the-codebase.md](../fundamentals/navigating-the-codebase.md) — boot and runtime tour
- [ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md) — pause AI pipeline

| Artifact | Purpose |
|----------|---------|
| [c4-holzen.md](c4-holzen.md) | Context + Container diagrams (Mermaid **C4** syntax) and maintenance notes |
| [workspace.dsl](workspace.dsl) | **Structurizr** workspace — open in [Structurizr Lite](https://structurizr.com/help/lite) or the Structurizr CLI to render PNG/SVG |

**Scope:** We document **Level 1 (Context)** and **Level 2 (Container)** only. Component-level C4 for each feature is intentionally omitted to avoid duplicating per-system guides unless onboarding or compliance needs it later.

**When to update:** After a new **external system** (payment, AI, email), a new **deployable** backend surface, or a change to **who talks to whom** at the boundary level. Bump the **Last updated** line in `c4-holzen.md` when you change diagrams or DSL.
