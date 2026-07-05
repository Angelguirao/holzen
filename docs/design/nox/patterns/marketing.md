# Marketing surfaces (Astro)

Holzen marketing pages (`apps/site/`) may use **one elevation tier** beyond the flat in-app hierarchy. Product screens inside the React SPA stay flat.

## Allowed (marketing only)

| Token | Use |
|-------|-----|
| `--nox-elevation-marketing-soft` | Form shells, hero panels with backdrop blur |
| `--nox-elevation-marketing-card` | Comparison cards, science strip, CTA band |
| `--nox-glass-surface` / `--nox-glass-border` | Glass nav, form shells (`hsl(var(--nox-glass-surface))`) |
| `--nox-border-subtle` / `--nox-border-strong` | Section dividers without inventing new border vars |

## Not allowed

- New shadow tokens outside `tokens.css`
- Hardcoded hex (`#DBB366`, `#0F172A`) — use Nox CSS variables or Tailwind `nox.*`
- User-facing copy below **12px** (`--nox-text-xs`) except decorative mono captions in product mocks
- Bright cyan links — use `--nox-color-text-link` / `text-nox-text-link`

## Component mapping

| Marketing class | Nox component (DESIGN.md) |
|-----------------|---------------------------|
| `.cta` | `button-primary` (inverse fill, 12px radius) |
| `.waitlist-input` | shadcn Input pattern (deep surface, focus ring) |
| `.comparison-panel` | Card on secondary surface + marketing-card elevation |
| `.brand` | Mono wordmark, highlight color |

## Motion

- Hero preview pulse: `breath-pulse` 4s ease-in-out — disable when `prefers-reduced-motion: reduce`
- Hover lifts: max `translateY(-2px)` on benefit cards; no parallax

## Parity goal

Marketing should **feel** like the app: same palette, fonts, and radius. Elevation is the intentional divergence — documented here so it does not leak into in-app screens.
