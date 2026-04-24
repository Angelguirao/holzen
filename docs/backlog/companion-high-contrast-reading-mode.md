# Companion reading: high-contrast mode

**Status:** backlog — not started.

**Scope:** **Companions** — inline pause cards, **Signal Full View** (`/companion/signal/:pauseInstanceId`), and any other long-form companion reading surfaces where typography and backgrounds should support low vision or bright sunlight without changing global app chrome.

---

## Goal

Offer a **high-contrast reading mode** (toggle or follows system `prefers-contrast: more` if we align with that) that improves **text/background separation** and focus states for companion copy.

## Direction

- Prefer a **theme token swap** (CSS variables / Tailwind semantic tokens) scoped to the reading container or route layout, rather than one-off hex overrides per component.
- Reuse existing design-system patterns where Holzen already defines **`foreground`** / **`background`** / **`muted`** (or equivalent); add a **`reading-high-contrast`** (name TBD) variant that companion trees opt into.
- Validate on **Signal Full View** first (primary “deep read” surface per [signal.md §7](../systems/pause/companions/signal.md)), then extend to inline companion cards if the token set proves sufficient.

## Links

- [signal.md §7 Full View](../systems/pause/companions/signal.md) — primary reading surface
- [backlog.md](backlog.md) — index
