# Mental models for contributors (SPA, React, Supabase)

This note is for anyone who is strong on **servers, databases, and HTTP APIs** but less familiar with how a **browser-first** codebase like Holzen is structured. It does **not** replace hands-on reading of the repo — see [navigating-the-codebase.md](navigating-the-codebase.md) for the concrete tour and [architecture/c4-holzen.md](../architecture/c4-holzen.md) for containers.

---

## How this relates to other docs

| Need | Read |
|------|------|
| **What file does what** in Holzen | [navigating-the-codebase.md](navigating-the-codebase.md) |
| **Pause flow, companions, cron** | [systems/pause/ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md), [ops/cron-setup.md](../ops/cron-setup.md) |
| **Auth & RLS** | [systems/auth/auth-and-referral-system.md](../systems/auth/auth-and-referral-system.md), [systems/routing/route-gating-system.md](../systems/routing/route-gating-system.md) |
| **HTTP-only testing** (Bruno, Postman) | [http-review-playbooks.md](http-review-playbooks.md) — app behavior still needs the browser |

---

## 1. Single-page application (SPA)

After the first load, **navigation** (e.g. `/` → `/pause`) is usually handled **in JavaScript** by the client router. The server does not send a new HTML document for each “page”; it sends **one shell** (and JS/CSS assets), and React **replaces** what you see by rendering different **components** for each route.

**Mental model:** think “**one long-lived desktop app** that happens to run inside a tab,” not “each click is a new server round-trip for HTML.”

**In Holzen:** routes live in `src/App.tsx`; see [navigating-the-codebase.md](navigating-the-codebase.md) (section *Routing and layout*).

---

## 2. React (components, state, hooks)

**Components** are functions (or classes) that **return UI** (JSX — HTML-like syntax in TypeScript). React **re-invokes** them when **state** or **props** change and **reconciles** the DOM.

**State** is “what should the UI show *right now*?” — local to a component unless lifted or shared via **context**.

**Hooks** (`useState`, `useEffect`, `useCallback`, …) are the **language feature** for wiring state and side effects into function components. A **custom hook** (e.g. `useHolzen`) is just a function whose name starts with `use` that **calls other hooks** and returns a small API — reusable logic for **one subtree** of the app, not a microservice.

**Mental model:** hooks are **not** “background workers” or global singletons; they run **inside** the component tree that called them.

**In Holzen:** feature logic often lives in `src/hooks/`; pages compose hooks and pass data into `src/components/`. See [navigating-the-codebase.md](navigating-the-codebase.md) (section *Data and “feature” state*).

---

## 3. TypeScript

TypeScript is **JavaScript with static types** at **compile time**. The browser still runs **JavaScript** after `vite build` strips types. Types help **refactors** and **API contracts** (`src/integrations/supabase/types.ts` vs the real schema).

**Mental model:** types are **documentation** and **checks** for developers; they are not a second runtime layer like the JVM.

---

## 4. Vite

The **dev server** serves modules fast and supports **hot reload** (edit a file, UI updates without full refresh). **Production** is a **static bundle** (JS/CSS) deployed to hosting (e.g. Lovable publish flow). Env vars are baked in at **build time** for the client (`VITE_*`); secrets that must stay server-side belong in **edge functions** or Supabase secrets, not in the SPA bundle.

**In Holzen:** [README.md](../../README.md) scripts, env modes, and `vite.config.ts` (port 8080, `@/` alias, PWA).

---

## 5. Supabase in the browser

Holzen uses the **Supabase JS client** for:

- **Auth** — session in the browser; **JWT** is sent on requests the client makes.
- **Postgres** — `supabase.from('…')` runs **queries** that are still subject to **Row Level Security (RLS)** on the server. The anon key is **not** a free pass; policies decide what rows you can read/write.
- **Edge functions** — `supabase.functions.invoke('name', { body })` is **HTTP** from the client to Supabase’s gateway → your Deno function. Auth is **your** responsibility inside the function (e.g. validate JWT or service role + `userId`).

**Mental model:** the SPA is a **thick client**. The database is **remote**; RLS is **server-side enforcement** of authorization, not “optional if the client behaves.” Edge functions are **small HTTP services** next to the DB, not “stored procedures.”

**In Holzen:** client in `src/integrations/supabase/client.ts`; functions under `supabase/functions/`; [navigating-the-codebase.md](navigating-the-codebase.md) (section *Supabase: edge functions*) maps **which** function is called from where.

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

The app wraps the tree in **QueryClientProvider** (`src/App.tsx`). TanStack Query is a **cache + sync** layer for **server state** (fetch, stale, refetch). Not every feature uses it; some hooks use **Supabase + `useEffect`** directly. When you see `useQuery` / `useMutation`, think **“cached HTTP/DB reads with lifecycle”** — not a replacement for RLS or edge auth.

---

## 8. PWA and service worker

Holzen can **install** as a PWA and uses a **service worker** for caching and update prompts (`vite-plugin-pwa`, `src/sw.ts`). This adds **offline-ish** behavior and **cache** semantics; it does not change Supabase security rules.

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

**Deeper React patterns (optional):** [Josh W. Comeau — React courses](https://www.joshwcomeau.com/) (paid, opinionated) or [Kent C. Dodds — Epic React](https://epicreact.dev/) (paid) — only if you want structured curriculum; the official React docs are enough for navigation-level reading.

---

## Related in-repo reading

- [codebase-size-and-review-practices.md](codebase-size-and-review-practices.md) — expectations for review depth across “frontend + Postgres + Deno.”
- Phased reviews [phase-1-frontend-routing-auth.md](../reviews/phase-1-frontend-routing-auth.md) through [phase-2-manual-pause-pipeline.md](../reviews/phase-2-manual-pause-pipeline.md) — contracts that assume the vocabulary above.
