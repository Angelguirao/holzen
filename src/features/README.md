# Feature modules (transitional layout)

Holzen keeps **root Vite** (`vite.config.ts`, `src/`, Lovable publish) while adopting bounded-context structure under `src/features/<context>/`.

**Canonical rules:** [docs/fundamentals/frontend-module-layout.md](../../docs/fundamentals/frontend-module-layout.md) (§0 Lovable, §10 transitional), [docs/fundamentals/holzen-application-architecture.md](../../docs/fundamentals/holzen-application-architecture.md).

## Layout per context

```text
features/<context>/
  domain/           # pure types + rules (no React, no Supabase)
  application/
    use-cases/      # named actions; call ports only
  ports/            # interfaces infrastructure implements
  public.ts         # cross-feature exports (no eager Supabase)
  public-queries.ts # optional: TanStack query modules
  public-hooks.ts   # optional: React hooks (screens, app, components, tests)
```

**Screens** (Home, Archive, Journey, Settings, Pause, marketing, admin) live in [`src/screens/`](../screens/README.md). **Design system** (`components/ui/`, `icons/`) and **app shell** (`app/components/`) are separate — see [components/README.md](../components/README.md) and [app/README.md](../app/README.md).

## New code

- Put **pause ritual** logic in `features/pause/` (companions and reflect are subfolders under `application/`, not a separate feature).
- Put **subscription**, **market**, **user**, **auth** in their own `features/<name>/` as you migrate.
- **user** and **subscription** use `public-queries.ts` for profile/snapshot TanStack modules; `public.ts` stays Supabase-free.
- **auth** — `AuthProvider` / `useAuth` exported from `features/auth/public.ts` (implementation in `presentation/`).
- Do **not** add new root-level `src/hooks/use-<feature>-*` or `src/lib/<feature>-*` for migrated contexts.
- Import domain hooks from `@/features/<ctx>/public-hooks` (not `presentation/` paths from `components/` or `src/hooks/`).

## Tests

Co-locate Vitest files with the module under test (`domain/foo.test.ts`, `application/session/bar.test.ts`). Cross-route flows stay in [`src/test/integration/`](../test/integration/README.md). Rules: [client-src-layout.md](../../docs/fundamentals/client-src-layout.md) (Testing), [src/test/README.md](../test/README.md).

## CI

`npm run check:feature-imports` — layer rules on `src/features/**/*.ts`; blocks deep feature imports and migrated `@/lib/pause-*` shims in active `hooks/`, `screens/`, `components/`, `app/`, and `test/`.

`npm run check:architecture-alignment` — waves 0–4 scaffold gate (five contexts, legacy excluded, runs `check:feature-imports`); in **`test:ci`**.
