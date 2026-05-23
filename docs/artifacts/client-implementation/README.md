# Client implementation notes

**Canonical log:** [implementation-notes.html](./implementation-notes.html)

One shared, append-only HTML log for **interpretation deltas** during non-trivial client work — architecture migration, feature epics, platform exit, cross-cutting refactors. Not a commit journal; not a second spec.

**Workflow:** [implementation-notes-workflow.md](../../fundamentals/implementation-notes-workflow.md)

## Initiative READMEs (backlog + spec links)

| Initiative | README | Log anchor |
|------------|--------|------------|
| Architecture migration | [architecture-migration/README.md](../architecture-migration/README.md) | `#initiative-architecture-migration` |
| Lovable / platform exit | [lovable-staging-and-platform-exit.md](../../ops/lovable-staging-and-platform-exit.md) | `#initiative-platform-exit` (add notes when ambiguous) |

When starting a new multi-slice epic, add a row to the **Active initiatives** table in `implementation-notes.html` and a matching `<h3 id="initiative-…">` section before the first note.
