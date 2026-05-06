# Mental models for contributors (SPA, React, Supabase)

This note is for anyone who is strong on **servers, databases, and HTTP APIs** but less familiar with how a **browser-first** codebase like Holzen is structured. It does **not** replace hands-on reading of the repo — see [navigating-the-codebase.md](navigating-the-codebase.md) for the concrete tour and [architecture/c4-holzen.md](../architecture/c4-holzen.md) for containers.

**How to use this page:** Skim [Start here — terms in plain language](#start-here--terms-in-plain-language) first if a word keeps tripping you up. Then read sections **1–6** in order (they build on each other). Sections **7–8** are optional extras (TanStack Query, PWA).

---

## Start here — terms in plain language

| Term | Plain language |
|------|----------------|
| **SPA (single-page application)** | You load the app **once**; after that, “going to another page” is mostly **JavaScript swapping what you see**, not the server sending a brand-new HTML document for each URL. |
| **Client / browser** | The user’s tab: where React runs and where the Supabase **anon** key and user **JWT** live (in memory / storage). |
| **Bundle** | The compiled **`.js` / `.css`** files the browser downloads. Built by Vite when you run `npm run build`. Not a separate server process — just static files. |
| **JSX** | Syntax that **looks like HTML inside TypeScript** but is really function calls that create a **description** of the UI. React turns that into real DOM updates. |
| **Component** | A **function** (usually) that returns JSX. Like a template with logic: “given these inputs, this is what should appear.” |
| **State** | Values the component **remembers** between renders (e.g. “loading”, “error message”). When state changes, React **re-runs** the component and updates the screen. |
| **Props** | **Inputs** passed from a parent component into a child (read-only from the child’s point of view). Like function arguments. |
| **Hook** | A function whose name starts with `use` that lets a component use **state**, **effects**, or **shared context**. Only call hooks at the **top level** of a component or custom hook — not inside `if` or loops (React rule). |
| **Effect (`useEffect`)** | “After the browser has painted, **do this**” — fetch data, subscribe to something, etc. Dependencies list says **when** to re-run. |
| **Context** | A way to pass data (e.g. current user) **down the tree** without threading props through every level. |
| **JWT** | Signed token proving **who** the user is. The Supabase client attaches it to requests so **Postgres RLS** and **edge functions** can authorize. |
| **Anon (publishable) key** | A **public** key shipped in the frontend bundle. It only lets you talk to Supabase **as** whoever is logged in; it does **not** bypass RLS. |
| **RLS (Row Level Security)** | **Postgres policies** evaluated on the **server** for each row. Even if the client sends a malicious query, the database **enforces** what rows are visible or writable. |
| **Edge function** | A **small HTTP service** (Deno) hosted next to your Supabase project. Invoked via `supabase.functions.invoke(...)` or cron/webhooks. Not the same as SQL stored procedures. |

If you wonder **“why not Next.js / a full framework?”**, see [spa-framework-evaluation.md](../backlog/spa-framework-evaluation.md) (backlog — strategic note, not a decision).

---

## How this relates to other docs

| Need | Read |
|------|------|
| **What file does what** in Holzen | [navigating-the-codebase.md](navigating-the-codebase.md) |
| **Pause flow, companions, cron** | [systems/pause/ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md), [ops/cron-setup.md](../ops/cron-setup.md) |
| **Auth & RLS** | [systems/auth/auth-and-referral-system.md](../systems/auth/auth-and-referral-system.md), [systems/routing/route-gating-system.md](../systems/routing/route-gating-system.md) |
| **HTTP-only testing** (Bruno, Postman) | [http-review-playbooks.md](http-review-playbooks.md) — app behavior still needs the browser |
| **Who enforces rules vs who projects UI** (layers, symmetry, TanStack Query vs UI state) | [client-server-architecture-holzen.md](client-server-architecture-holzen.md) |

---

## 1. Single-page application (SPA)

**Classic server-rendered site:** Each navigation often means **HTTP request → new HTML** from the server (or a full template render).

**SPA:** The first load downloads **HTML shell + JS bundle**. The JS bootstraps React. After that, changing the path (e.g. `/` → `/pause`) is handled by **client-side routing**: React **unmounts** one screen and **mounts** another — **without** asking the server for a new HTML page each time.

**Mental model:** A **long-lived app in a tab**, not “every click equals one server HTML response.” (Data still loads over the network — Supabase, `fetch`, etc. — but the **document** is not replaced wholesale.)

**Caveat:** Initial `index.html` is still a real file; SEO crawlers see that first unless you add prerendering or SSR (out of scope here; see backlog link above).

**In Holzen:** Routes live in `src/App.tsx`; see [navigating-the-codebase.md](navigating-the-codebase.md) (section *Routing and layout*).

---

## 2. React (components, state, hooks)

**What “React renders” means:** React calls your component functions and builds a **tree** of UI descriptions. It compares to the previous tree and **updates the real DOM** where things changed (“reconciliation”). You rarely touch the DOM by hand.

**Props vs state:** **Props** come from outside (“show this user’s name”). **State** is internal (“modal open or closed”). Either can change; when they do, React **re-runs** the affected components.

**Hooks:** Built-in hooks attach **state** (`useState`), **lifecycle side effects** (`useEffect`), **memoized callbacks** (`useCallback`), etc. A **custom hook** (e.g. `useHolzen`) bundles several hooks and returns an object of values and functions — **reusable logic** for any component that calls it.

**Important:** Hooks are **not** microservices or daemons. Each **call** is tied to **one place in the component tree**. Two different screens calling `useHolzen()` get **separate** state unless you lift state up or use global stores (this app mostly uses hooks + Supabase, not Redux).

**In Holzen:** Feature logic often lives in `src/hooks/`; pages compose hooks and pass data into `src/components/`. See [navigating-the-codebase.md](navigating-the-codebase.md) (section *Data and “feature” state*).

---

## 3. TypeScript

TypeScript adds **static types** while you edit and build. After `vite build`, types are **erased** — the browser runs ordinary JavaScript.

**Mental model:** Types are **checked documentation**. They catch many bugs before runtime but **do not** enforce security; RLS and edge auth still matter.

**In Holzen:** `src/integrations/supabase/types.ts` mirrors the DB shape; drift between types and real migrations is a familiar maintenance task.

---

## 4. Vite

**Dev:** `npm run dev` starts a **dev server** (fast reload, often **HMR**: edit a file, see changes without losing all state).

**Prod:** `npm run build` outputs **static files** (HTML, JS, CSS) you host on a CDN or static host. No Node server required for **serving** the SPA — though **APIs** are still Supabase in the cloud.

**Env:** Anything prefixed `VITE_` is exposed to the **client bundle**. Never put **secrets** there; use Supabase **Edge Function secrets** or dashboard secrets for server-side keys.

**In Holzen:** [README.md](../../README.md) scripts, env modes, and `vite.config.ts` (port 8080, `@/` alias, PWA).

---

## 5. Supabase in the browser

Three different “doors” from the same JS client:

1. **Auth** — Log in, get a **session** and **JWT**. Supabase client stores this and attaches it to later calls.
2. **Postgres (`supabase.from('table')`)** — Still **HTTP** from the browser to Supabase’s API, which runs your query **with** the user’s JWT. **RLS** runs in Postgres — not in the user’s browser.
3. **Edge functions (`supabase.functions.invoke`)** — **HTTP** to your function code. Your function must **validate** the JWT (or use service role for trusted server callers) and implement its own rules.

**Mental model:** The SPA is a **thick client**: lots of logic in the browser, but **authoritative data rules** for Postgres are on the **server** (RLS). Edge functions are **tiny HTTP services**, not “just SQL.”

**In Holzen:** Client in `src/integrations/supabase/client.ts`; functions under `supabase/functions/`; [navigating-the-codebase.md](navigating-the-codebase.md) (section *Supabase: edge functions*) maps **which** function is called from where.

---

## 6. Where work runs (one picture)

| Where | What runs |
|-------|-----------|
| **Browser** | React, React Router, hooks, TanStack Query (if used), PWA/service worker |
| **Supabase Edge (Deno)** | HTTP handlers, `invoke` targets, cron-triggered jobs, webhooks |
| **Postgres** | Data, RLS, triggers (see `supabase/migrations/`) |

A single **user flow** (e.g. manual pause) often touches **all three** in sequence — see [ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md).

---

## 7. TanStack Query (React Query)

The app wraps the tree in **QueryClientProvider** (`src/App.tsx`). TanStack Query is a **cache and lifecycle** helper for **async data** (fetch, stale time, refetch on focus, etc.).

Not every Holzen feature uses it; some code uses **Supabase inside `useEffect`** instead. If you see `useQuery` / `useMutation`, read it as: **“server data with caching rules.”** It does **not** replace RLS or edge auth.

---

## 8. PWA and service worker

Holzen can **install** as a PWA. A **service worker** (`vite-plugin-pwa`, `src/sw.ts`) can cache assets and prompt for updates. That affects **offline-ish** behavior and **which JS/HTML** loads first; it does **not** change Postgres RLS.

---

## When something still feels opaque

- **Learning order:** [navigating-the-codebase.md](navigating-the-codebase.md) **§19 — Learning path: pause first, then whole app** — phased **docs → code → Network** steps.
- **Trace one button:** Follow imports from a page → hook → `supabase` or `invoke`. Names in code beat abstract definitions.
- **Bruno vs browser / UI journeys:** [http-review-playbooks.md](http-review-playbooks.md) exercises **HTTP** only. Full **click-through** flows (pause, journal, settings) need **Playwright / Cypress / Vitest+RTL** — see [e2e-browser-automation.md](../backlog/e2e-browser-automation.md). Bruno does **not** replace that.
- **Phased reviews:** [phase-1-frontend-routing-auth.md](../reviews/phase-1-frontend-routing-auth.md) and [phase-2-manual-pause-pipeline.md](../reviews/phase-2-manual-pause-pipeline.md) spell out **contracts** between routes, hooks, and edge functions.

---

## Suggested external resources

These are **general** primers; skim what you need, then return to the repo.

| Topic | Resource |
|-------|----------|
| **React (modern)** | [React Docs — Learn](https://react.dev/learn) (official); [Thinking in React](https://react.dev/learn/thinking-in-react) |
| **Hooks** | [React — Hooks reference](https://react.dev/reference/react/hooks) |
| **TypeScript** | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) (start with *The Basics*, *Everyday Types*) |
| **MDN — SPA** | [Single-page application](https://developer.mozilla.org/en-US/docs/Glossary/SPA) |
| **Vite** | [Vite Guide](https://vitejs.dev/guide/) |
| **Supabase (overview)** | [Supabase Docs — Start](https://supabase.com/docs/guides/getting-started) |
| **RLS** | [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) |
| **Edge Functions** | [Edge Functions](https://supabase.com/docs/guides/functions) |
| **TanStack Query** | [Overview](https://tanstack.com/query/latest/docs/framework/react/overview) |

**Deeper React patterns (optional):** [Josh W. Comeau — React courses](https://www.joshwcomeau.com/) (paid) or [Kent C. Dodds — Epic React](https://epicreact.dev/) (paid) — only if you want structured curriculum; the official React docs are enough for navigation-level reading.

---

## Related in-repo reading

- [codebase-size-and-review-practices.md](codebase-size-and-review-practices.md) — expectations for review depth across “frontend + Postgres + Deno.”
- [spa-framework-evaluation.md](../backlog/spa-framework-evaluation.md) — Vite SPA vs full-stack React frameworks (React team docs; when to reconsider).
