# Shared mirror tests (Deno logic, Vitest runtime)

Some edge helpers run under **Deno** in production (`supabase/functions/_shared/*.ts`) and cannot be imported directly into Vitest when they pull `Deno.*` or `https://` deps.

Tests here **mirror** the pure decision logic (e.g. circuit-breaker `buildState`, app-config panic-mode gates) in plain TypeScript. If the Deno source changes, update the mirror in the same PR.

**Prefer** co-locating tests beside `_shared` modules that have **no** Deno-only imports — see `supabase/functions/_shared/*.test.ts` (included via `vitest.config.ts`).
