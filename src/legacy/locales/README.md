# Legacy locale bundles (not shipped)

Pre–pause-first translations (`de`, `es`, `fr`, `nl`, `pt`, `tr`). **Runtime i18n loads only** [`src/locales/en.json`](../../locales/en.json).

**Full English snapshot (pre-strip):** recover from git tag `full-ia-pre-strip` → `src/locales/en.json` (not duplicated here to avoid drift).

Restore a language by copying keys into `en.json` (or re-wiring `src/i18n.ts`) — do not import these files from active code.
