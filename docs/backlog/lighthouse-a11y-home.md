# Lighthouse: accessibility failures on Home (`/`)

**Status:** backlog — addresses **axe** audits from Lighthouse (navigation, desktop) on **`http://localhost:8080/`**.

## Goal

Raise **Accessibility** score by fixing audits that failed in the **2026-04-03** run (see [report](../reports/2026-04-03-home-localhost-360-analysis.md)).

## Findings (from Lighthouse)

| Audit | Issue |
|--------|--------|
| **`button-name`** | **Three** `<button>` elements lack an accessible name (icon-only / no `aria-label` / no visible text). |
| **`color-contrast`** | Foreground/background ratio insufficient (e.g. **`h1.text-sm`** in header). |
| **`label-content-name-mismatch`** | **Notification** control: `aria-label="Notifications"` but visible badge **“9”** not reflected in accessible name. |
| **`landmark-one-main`** | Document lacks a **`<main>`** landmark (or `role="main"`). |
| **`target-size`** | **“Collapse Market”** button **16×16px** — below **24×24px** minimum (spacing to neighbors also tight). |

**Best practices** `errors-in-console` ( **`sw.js`** MIME) is tracked under [service-worker-registration-dev.md](service-worker-registration-dev.md), not this ticket.

## Direction

- Fix in **small PRs** (e.g. landmarks + one button cluster at a time).
- Re-run Lighthouse in the same MCP setup to confirm.
- Overlap with Chrome **Issues** (form `name`/`id`/`autocomplete`): [form-field-name-id-a11y.md](form-field-name-id-a11y.md).

## Related

- [browser-360-mcp-playbook.md](../fundamentals/browser-360-mcp-playbook.md) — how the run was produced.
