# Lighthouse: accessibility failures on Home (`/`)

**Status:** shipped (2026-04) — addresses the **2026-04-03** audit list in [report](../reports/2026-04-03-home-localhost-360-analysis.md). Re-run Lighthouse to confirm scores in your environment.

## What shipped

| Audit | Change |
|--------|--------|
| **`landmark-one-main`** | **`AppLayout`:** primary column uses **`<header>`** + **`<main id="main-content">`** wrapping **`Outlet`**. |
| **`color-contrast`** | App title **`h1`:** `text-muted-foreground` → **`text-foreground/80`** for stronger contrast on the shell background. |
| **`label-content-name-mismatch`** | **`NotificationBell`:** **`aria-label`** includes unread count when the badge is visible (e.g. “Notifications, 3 unread”), with **`aria-hidden`** on the decorative bell icon and badge digit span. |
| **`target-size`** | **Widget collapse** (**`HomeWidget`**): **36×36** hit target, **`aria-expanded`**, slightly larger chevron. **Dismiss / icon controls** on **Home** (reflection + ground preview), **`NightReflectionCard`**, and **`BtcStatus`** (BTC mode + price visibility): **36×36** **`inline-flex`** controls with **`aria-hidden`** on icons. Bell trigger uses **`min-h-9 min-w-9`**. |

## **`button-name`**

Icon-only controls above now pair **`aria-label`** with **`aria-hidden`** on glyphs where needed. If **axe** still flags a specific control after re-run, treat it as a follow-up (likely another subtree on **`/`**).

## Related

- [form-field-name-id-a11y.md](form-field-name-id-a11y.md) — form controls.
- [browser-360-mcp-playbook.md](../fundamentals/browser-360-mcp-playbook.md) — how the original run was produced.
