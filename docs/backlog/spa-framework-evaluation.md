# SPA vs full-stack React framework (evaluation backlog)

**Status:** Not scheduled — strategic / architectural.  
**Why it exists:** The React docs explicitly contrast **recommended full-stack frameworks** (Next.js App Router, React Router v7 + Vite, Expo, etc.) with **building from scratch** using a bundler such as Vite. Holzen today is the latter: a **Vite + React SPA** with **client-side routing**, **Supabase** (auth, Postgres, edge functions), and **Lovable**-driven delivery. This note captures the tradeoff so we revisit it deliberately, not by accident.

---

## Official framing (React team)

- **[Creating a React App](https://react.dev/learn/creating-a-react-app)** — Prefer a framework for production; frameworks integrate routing, data loading patterns, and deployment paths. They support CSR, SPA, and SSG; many allow **SSR per route** later without rewriting the whole app.
- **[Build a React App from Scratch](https://react.dev/learn/build-a-react-app-from-scratch)** — Vite (as used here) is a valid starting point, but you **assemble** routing, data-fetching conventions, and operational patterns yourself — “a lot like building your own framework.”

**Deep dive on the “full-stack vision”** (Server Components, Suspense + data loading, etc.) is summarized on the same “Creating a React App” page under *Which features make up the React team’s full-stack architecture vision?* — adopting those features **at the framework level** is non-trivial; rolling your own means **you** integrate future React capabilities.

---

## Why this matters for Holzen

| If the product later needs… | “From scratch” SPA implication |
|----------------------------|----------------------------------|
| **SSR / SSG / prerender** for SEO or social previews | Implement or bolt on yourself (or use host prerender); not built into Vite alone. |
| **React Server Components** or framework-level **Suspense data** patterns | Requires a framework that implements the spec, or custom build pipeline. |
| **Fewer client waterfalls**, opinionated **loader** patterns | Frameworks optimize this; SPA + ad hoc `useEffect` / TanStack Query needs discipline. |
| **Easier onboarding** for contributors used to Next/React Router framework | Custom stack is unique — harder to map from generic tutorials. |

None of this **forces** a migration. Supabase already provides **backend** auth, DB, and **Deno edge functions**; a “React framework” mainly reshapes **how the front shell** is built and rendered. A move would be a **large** project (routing, auth session handling, env, PWA, Lovable publish story).

---

## When to schedule a real spike

- Public/marketing surfaces need **strong SEO** or **stable crawled HTML** beyond current static shell + optional host prerender.
- We want **RSC** or **server-driven data** for specific routes without duplicating logic.
- Maintenance cost of **custom routing + data** patterns clearly exceeds team capacity.

Until then, this item stays **documentation + backlog pointer** only.

---

## Related in-repo

- [mental-models-for-contributors.md](../fundamentals/mental-models-for-contributors.md) — SPA vs server boundaries.
- [navigating-the-codebase.md](../fundamentals/navigating-the-codebase.md) — current boot and routing layout.
