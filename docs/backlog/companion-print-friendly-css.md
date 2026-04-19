# Companion reading: print-friendly CSS

**Status:** backlog — not started.

**Scope:** **Companions** — especially **Signal Full View** and other surfaces where users may want a **paper or PDF** copy of generated content (source attribution, body text, optional metadata).

---

## Goal

When the user invokes **Print** (browser print or “Save as PDF”), companion reading layouts render **readable, non-wasteful** pages: sensible margins, **no chrome-only UI** (nav, sticky bars, decorative gradients), preserved **source URL / attribution**, and **no clipped overflow** from immersive backgrounds.

## Direction

- Add or extend **`@media print`** rules scoped to companion full-view roots (and any shared “article” wrapper).
- **`display: none`** or **`visibility: hidden`** for app shell elements that should not print; consider **`color-adjust: exact`** only where brand requires it (otherwise respect user print settings).
- Test **Chrome / Safari / Firefox** print preview on at least one long Signal payload.

## Links

- [signal.md §7 Full View](../systems/pause/companions/signal.md)
- [backlog.md](backlog.md) — index
