# Screens (presentation layer)

Route-scoped UI and thin orchestration live here. **Domain rules** stay in `src/features/<context>/`.

**Canonical:** [docs/fundamentals/client-src-layout.md](../../docs/fundamentals/client-src-layout.md), [docs/fundamentals/frontend-module-layout.md](../../docs/fundamentals/frontend-module-layout.md) §11 (waves 5b–5i), [docs/fundamentals/react-screen-orchestration.md](../../docs/fundamentals/react-screen-orchestration.md).

## Related folders

| Folder | Role |
|--------|------|
| `src/app/components/` | Cross-route shell (layout, bottom nav, page meta) — see [src/app/README.md](../app/README.md) |
| `src/components/` | Design system (`ui/`) + shared icons — [components/README.md](../components/README.md) |

## Layout

```text
screens/<route>/
  components/     # presentation for this route only
  hooks/          # orchestration used only by this screen (optional)
  *Screen.tsx     # route entry (lazy-loaded from App.tsx)
```

| Screen folder | Routes / product area | Screen map doc |
|---------------|----------------------|----------------|
| `home/` | `/` — **`HomeScreen`**, `components/`, `hooks/` (incl. `useHolzen`) | [docs/screens/home.md](../../docs/screens/home.md) |
| `pause/` | `/pause`, `/companion/*` — **`PauseSessionScreen`**, `components/`, `hooks/` | [docs/screens/pause.md](../../docs/screens/pause.md) |
| `archive/` | Archive tab — **`ArchiveScreen`**, `hooks/`, `components/` (+ `library/`) | [README](archive/README.md), [IA](../../docs/design/information-architecture.md) |
| `journey/` | Journey tab — **`components/` migrated (5e)** | [docs/screens/journey-overview.md](../../docs/screens/journey-overview.md) |
| `settings/` | Settings hub — **`SettingsStateLayout`**, `hooks/`, `components/` | [README](settings/README.md) |
| `marketing/` | Public pages — **`AboutScreen`**, landing **`components/`** | [README](marketing/README.md) |
| `admin/` | `/admin` — **`AdminScreen`**, `hooks/`, **`components/`** | [README](admin/README.md) |
| `ops/` | Dev/ops (`/smoke-test`, `/edge-coverage`, …) | [README](ops/README.md) |

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
| Home dashboard UI + hooks | `screens/home/components/` (`HoldGoalWidget`, `InstallHolzenCard`, `ThresholdFrequencyEstimator`, onboarding), `hooks/` |
| Settings prefs UI | `screens/settings/components/` (`ThresholdSetting`, `QuietWindowsManager`, …) |
| Route wiring | `App.tsx` → `screens/<route>/*Screen.tsx` |
| Primitives / mood glyphs | [components/README.md](../components/README.md) (`ui/`, `icons/`) |
| Home → Pause flow (layers + RPC/edge) | [client-src-layout.md](../../docs/fundamentals/client-src-layout.md) § Reference flow |
