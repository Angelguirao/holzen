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
  public-queries.ts # optional: TanStack query modules for app hooks/screens
```

**Screens** (Home, Archive, Settings, Pause UI) stay in `src/pages/` and `src/components/` until a deliberate move to `src/screens/` — Lovable and existing checks assume root `src/`.

## New code

- Put **pause ritual** logic in `features/pause/` (companions and reflect are subfolders under `application/`, not a separate feature).
- Put **subscription**, **market**, **user**, **auth** in their own `features/<name>/` as you migrate.
- **user** and **subscription** use `public-queries.ts` for profile/snapshot TanStack modules; `public.ts` stays Supabase-free.
- **auth** — `AuthProvider` / `useAuth` exported from `features/auth/public.ts` (implementation in `presentation/`).
- Do **not** add new root-level `src/hooks/use-<feature>-*` or `src/lib/<feature>-*` for migrated contexts.

## CI

`npm run check:feature-imports` — layer rules on `src/features/**/*.ts` (passes when only READMEs exist).
