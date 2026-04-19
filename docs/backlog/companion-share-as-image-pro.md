# Companion share as image (Pro)

**Status:** backlog — not started.

**Scope:** **Companions** — shareable moments from **Signal Full View** and related reading surfaces. **Pro-gated** (same commercial posture as other Pro companion affordances).

---

## Goal

Let **Pro** users export the current companion reading frame as a **shareable image** (social, messages, archive) without server-side rendering of arbitrary HTML.

## Direction

- **Client-side capture** with [`html-to-image`](https://github.com/bubkoo/html-to-image) (or equivalent) on a **dedicated export root** node: stable dimensions, webfont loaded, CORS-safe assets only.
- **Design pass required** — layout, typography, watermark or Holzen mark, safe margins for crop platforms, and **light/dark** variants before engineering locks the DOM snapshot.
- Gate on **subscription / Pro** check consistent with existing Pro patterns (e.g. “Save this moment” on Signal Full View).

## Risks / notes

- Foreign-origin images without CORS may taint the canvas; prefer **same-origin** or inlined assets for the export subtree.
- Large DOM or CSS filters can make capture slow on low-end mobile; consider **progressive** UX (spinner, downscale).

## Links

- [signal.md §7 Full View](../systems/pause/companions/signal.md) — primary surface
- [backlog.md](backlog.md) — index
