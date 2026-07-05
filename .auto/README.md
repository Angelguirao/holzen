# holzen/.auto — auto meta-layer state

This folder is managed by [auto](../auto) (sibling repo). Product code lives elsewhere in holzen.

| File | Purpose |
|------|---------|
| `consensus.md` | Relay baton — last cycle, next action, backlog |
| `spec.yaml` | Computable system summary for agent cycles |
| `phase.yaml` | Lifecycle phase and gate status |
| `computability.result.yaml` | Six-test gate record |
| `journal.jsonl` | Append-only cycle log |

**Do not** put product source here. Cycles run in operate mode: maintenance only unless backlog items are human-approved.
