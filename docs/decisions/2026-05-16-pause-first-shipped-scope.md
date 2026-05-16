# ADR: Pause-first shipped scope (May 2026)

## Context

Holzen accumulated a full IA (Tools, Journey tabs, badges, stats) alongside the core pause ritual. Pre-launch we have no production users requiring bookmark preservation (§3.1 test-only assumption).

## Decision

1. **Ship** a 4-tab shell: Home · Archive · Journey · Settings.
2. **Preserve** full IA in git (`full-ia-pre-strip` tag, `archive/full-ia-pre-strip`, `src/legacy/full-shell/`) without runtime redirects.
3. **404 only** for retired paths — no `/library` → `/archive` or `/journey/stats` → `/journey` shims.
4. **No global feature flag** — the router is the product boundary.
5. **Aggressive DB/edge cutover** in Step 5 after client disconnect (Tier B drops, edge undeploy).

## Consequences

- Old URLs show NotFound; analytics via `app.route_not_found`.
- Agents and humans use `docs/ops/active-surface.md` as the single shipped manifest.
- English-only slim locale until translations are rebuilt (Step 4).

## Recovery

```bash
git checkout archive/full-ia-pre-strip
# or: git show full-ia-pre-strip
```
