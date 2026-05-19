# Client `src/` layout (presentation + features)

**Status:** accepted (post wave 5j, May 2026)  
**Audience:** contributors and agents placing UI or client domain code  
**Pairs with:** [client-server-architecture-holzen.md](client-server-architecture-holzen.md) (truth vs projection), [frontend-module-layout.md](frontend-module-layout.md) (waves, CI, monorepo north star), [holzen-application-architecture.md](holzen-application-architecture.md) (principles §7–8)

This doc is the **folder-level map** of active `src/`. It does **not** replace subsystem behavior docs under `docs/systems/` or the C4 **external** view in [architecture/c4-holzen.md](../architecture/c4-holzen.md).

---

## Layer diagram (client)

```mermaid
flowchart TB
  subgraph client["Client (untrusted projection)"]
    App["src/app — shell chrome"]
    Screens["src/screens — route UI + thin hooks"]
    Comp["src/components — ui + icons"]
    Features["src/features — domain + use cases"]
  end
  subgraph server["Server (authority)"]
    PG["Postgres + RLS + RPCs"]
    Edge["Edge functions"]
  end
  App --> Screens
  Screens --> Comp
  Screens --> Features
  Features --> PG
  Features --> Edge
```

**Import direction (normative):** `app` → `screens` → (`components` | `features`). Features do **not** import screens. `components/ui` does **not** import features (wire data via props from screen hooks).

---

## Folder roles

| Path | Layer | Put here when… | Local index |
|------|-------|----------------|-------------|
| `src/app/components/` | Shell | Cross-route chrome (nav, meta, checkout, feedback) | [app/README.md](../../src/app/README.md) |
| `src/screens/<route>/` | Presentation | Route UI, screen-only hooks | [screens/README.md](../../src/screens/README.md) |
| `src/components/ui/` | Design system | Primitives used on **2+** routes | [components/README.md](../../src/components/README.md) |
| `src/components/icons/` | Design system | Shared mood/outcome glyphs | same |
| `src/features/<context>/` | Domain + application | Bounded context rules, use cases, ports | [features/README.md](../../src/features/README.md) |
| `src/pages/` | Shim | Thin re-exports only — `App.tsx` loads `screens/*` | — |
| `src/hooks/`, `src/lib/` | Transitional | Shims and shared I/O until fully migrated | Prefer `features/*/public` |
| `src/legacy/` | Archive | Pre-strip full IA — **never import** in active code | [legacy/README.md](../../src/legacy/README.md) |

**Closed:** `src/components/*.tsx` at repo root (`npm run check:no-root-components`).

---

## Ongoing alignment review

Use this checklist when opening a PR that touches `src/` (human or agent). Full principles: [holzen-application-architecture.md](holzen-application-architecture.md) P1–P9.

| # | Question | Green | Red flag |
|---|----------|-------|----------|
| 1 | **Where is authority?** | RLS / RPC / edge enforces the rule | Rule only in React or `disabled` on a button |
| 2 | **Screen or context?** | New code in existing `features/<ctx>/` | New `features/home` because Home tab grew |
| 3 | **Which presentation bucket?** | Single route → `screens/…/components/`; shared primitive → `ui/`; shell → `app/` | New root `src/components/Foo.tsx` |
| 4 | **Import direction?** | Screen → `@/features/<ctx>/public` | Feature → screen; `ui/` → feature |
| 5 | **Shipped surface?** | Matches [active-surface.md](../ops/active-surface.md); no `@/legacy` | Tier B tables, dropped profile columns |

**When docs drift:** update the **one owner** in [docs/README.md](../README.md) canonical table; update folder READMEs if placement rules change.

---

## Where to document what (do not merge layers)

| Kind of doc | Keep in | Not in |
|-------------|---------|--------|
| Principles, bounded contexts, alternatives | `docs/fundamentals/holzen-application-architecture.md` | `src/` (READMEs are indexes only) |
| External systems (Stripe, Supabase product) | `docs/architecture/c4-holzen.md` | Per-route READMEs |
| **This folder map + review checklist** | `docs/fundamentals/client-src-layout.md` (this file) | Duplicating full tables in AGENTS |
| Pause lifecycle / RPC contracts | `docs/systems/pause-system.md` | `src/screens/pause/README` (no second owner) |
| “Where is file X?” cheat sheet | `src/*/README.md`, [navigating-the-codebase.md](navigating-the-codebase.md) | New top-level doc per tab |

Moving long architecture narratives into `src/` would split ownership and stale faster. **`src/README.md` + three presentation READMEs** should stay short and link here.

---

## Reference flow: Home → Pause (manual “Need a moment”)

Traces one **shipped** vertical slice: user starts a manual pause from Home and lands on `/pause`. Canonical contracts: [pause-system.md](../systems/pause-system.md), [screens/pause.md](../screens/pause.md), [ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md).

### 1. User action → navigation

| Step | Layer | Code |
|------|-------|------|
| Tap “Need a moment” (or equivalent CTA) | Screen | `HomeScreen` → `HomePauseCardBody` via `useHomePauseCardProjection` |
| Orchestration | Screen hook | `useHomePauseActions.handleNeedAPause` |
| Market + pause create | Screen hook → feature | `useHolzen.manualTrigger` → `generateMessage` |
| RPC (authority) | Feature infra | `pauseCreateOrReuse` → Postgres `pause_create_or_reuse` |
| Route change | Router | `navigate('/pause', { state: PauseSessionLocationState })` |

`generateMessage` (in `use-holzen.ts`) builds context from BTC data (`features/market` query + `buildPauseContextFromMarket`, fingerprint helpers in `features/pause`), then calls **`pauseCreateOrReuse`** — it does **not** call `holzen-reflect` on Home. Non-silent manual opens clear the Home reflection stub and pass `pauseInstanceId` + context through location state.

### 2. `/pause` screen

| Step | Layer | Code |
|------|-------|------|
| Route | App | `App.tsx` lazy-loads `PauseSessionScreen` (full-screen, no `AppLayout`) |
| Conductor | Screen hook | `usePauseSessionScreen` composes shell, ritual, step handlers |
| Subscription gate | Screen + feature | `useSubscription` / `useProGate`; blocks with `PauseEngagementBlocked` when `!canEngagePause` |
| Hydration | Screen hooks + feature | `usePauseSessionShell`, location state, `v_pause_full` / session queries |
| Ritual UI | Screen components | `PauseSessionGate` → depth picker or `PauseSessionScaffoldShell` → `PauseDecide`, etc. |
| Step mutations | Screen hooks → feature | `pauseLogStep` / `pauseLogCompanion` via `features/pause/public-rpc` |

Step handlers under `screens/pause/hooks/` call **`pauseLogStep`** (e.g. feel/shift, breath segments, decide outcome). RPC return value drives `engaged` / `completed` and PostHog `pause_engaged` / `pause_completed` inside `pause-rpc-client.ts`.

### 3. Deep ritual — AI (after instance exists)

| Step | Layer | Code |
|------|-------|------|
| Reflect copy | Screen hook → feature | `usePauseReflectGeneration` → `generateReflectionAtReflectStep` |
| Edge | Feature infra | `invokeEdge('holzen-reflect', …)` (`x-cid` via `invoke-edge`) |
| Persist artifacts | Feature infra | `pause_ai_artifacts` upsert (`reflection_text`, haiku, …) |
| Companions | Screen hook → feature | `useCompanionData` → `invokeEdge('companion-orchestrate', …)` |
| Full-view routes | Screen | `/companion/{signal,grounding,history,zoom-out}/:pauseInstanceId` |

Brief ritual skips Frame/Reflect companions per [pause-system.md](../systems/pause-system.md); deep ritual runs reflect during the Reflect→Decide window and orchestrates companion slots per step.

### Sequence (manual open)

```mermaid
sequenceDiagram
  participant U as User
  participant Home as screens/home
  participant Holzen as useHolzen
  participant PauseFeat as features/pause
  participant PG as Postgres RPC
  participant Pause as screens/pause
  participant Edge as Edge functions

  U->>Home: Need a moment
  Home->>Holzen: manualTrigger()
  Holzen->>Holzen: fetch BTC context
  Holzen->>PauseFeat: pauseCreateOrReuse()
  PauseFeat->>PG: pause_create_or_reuse
  PG-->>PauseFeat: instance_id, state
  Holzen-->>Home: instanceId + context
  Home->>Pause: navigate /pause (location state)
  Pause->>PauseFeat: pauseLogStep (ritual steps)
  PauseFeat->>PG: pause_log_step
  Note over Pause,Edge: Deep ritual only
  Pause->>PauseFeat: generateReflectionAtReflectStep
  PauseFeat->>Edge: holzen-reflect
  Edge-->>PauseFeat: reflection + artifacts
  Pause->>PauseFeat: companion-orchestrate
  PauseFeat->>Edge: companion-orchestrate
  Edge-->>Pause: companion payloads
  Pause->>PG: pause_log_step outcome_logged
  PG-->>Pause: completed
```

### How to use this flow in review

Walk the sequence once in DevTools **Network** when changing pause code: expect `rpc/pause_create_or_reuse` after Home CTA, then `rpc/pause_log_step` on `/pause`, then `functions/v1/holzen-reflect` and `companion-orchestrate` on deep ritual steps. If a rule appears only in React (e.g. button `disabled`) but not in RPC/RLS/edge, flag it against checklist row **1** above.

---

## Related

- [src/README.md](../../src/README.md) — shipped routes
- [AGENTS.md](../../AGENTS.md) — commands and edit table
- [react-screen-orchestration.md](react-screen-orchestration.md) — conductor pattern inside a screen
- End-to-end sequence (generic use case → adapter): [holzen-application-architecture.md](holzen-application-architecture.md) §6.3
