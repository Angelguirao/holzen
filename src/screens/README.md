# Screens (presentation layer)

Route-scoped UI and thin orchestration live here. **Domain rules** stay in `src/features/<context>/`.

**Canonical:** [docs/fundamentals/frontend-module-layout.md](../../docs/fundamentals/frontend-module-layout.md) §11 (waves 5b–5i), [docs/fundamentals/react-screen-orchestration.md](../../docs/fundamentals/react-screen-orchestration.md).

## Layout

```text
screens/<route>/
  components/     # presentation for this route only
  hooks/          # orchestration used only by this screen (optional)
  *Screen.tsx     # optional main export (pages/ may re-export)
```

| Screen folder | Routes / product area | Screen map doc |
|---------------|----------------------|----------------|
| `home/` | `/` — **`HomeScreen`**, `components/`, `hooks/` (incl. `useHolzen`) | [docs/screens/home.md](../../docs/screens/home.md) |
| `pause/` | `/pause`, `/companion/*` — **`PauseSessionScreen`**, `components/`, `hooks/` | [docs/screens/pause.md](../../docs/screens/pause.md) |
| `archive/` | Archive tab — **`components/` migrated (5e)** | [docs/design/information-architecture.md](../../docs/design/information-architecture.md) |
| `journey/` | Journey tab — **`components/` migrated (5e)** | [docs/screens/journey-overview.md](../../docs/screens/journey-overview.md) |
| `settings/` | Settings hub — **`components/` migrated (5e)**; route shells in `pages/settings/` | — |
| `marketing/` | Landing, blog, legal — **`components/` migrated (5g)** | — |
| `admin/` | `/admin` — **`components/` + screen (5g)** | — |

## Rules

1. **No new files** at `src/components/*.tsx` (root) — use `screens/<route>/components/` or `components/ui/`. Enforced by `npm run check:no-root-components`.
2. **No domain logic** — import `@/features/<ctx>/public` (+ `public-queries` / `public-rpc` as documented).
3. **No `@/legacy/**`** in active code.
4. **Shared UI** only when **two or more screens** need it; otherwise colocate under the screen folder.
5. **`src/components/ui/`** remains the design system (shadcn primitives).

## Navigation cheat sheet

| I need… | Start here |
|---------|------------|
| Pause ritual UI | `screens/pause/components/` |
| Pause rules / RPC | `features/pause/` |
| Home dashboard UI + hooks | `screens/home/components/`, `screens/home/hooks/` (**5d**, **5h**) |
| Route wiring | `src/pages/` + `App.tsx` |
| Primitives | `components/ui/` |
