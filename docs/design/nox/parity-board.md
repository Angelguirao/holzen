# Nox Parity Board

Status keys:

- `ready`: migrated and verified
- `partial`: migrated core primitives/tokens, needs route polish
- `blocked`: awaiting missing component/asset decision

## Batch 1 routes

| Route | Status | Notes |
|---|---|---|
| `/` | ready | Nox header + token bridge + primitive updates applied |
| `/library` | ready | Nox header + shared primitive migration in place |
| `/journey` | ready | Journey hub (was profile-era route); token bridge + shared Nox primitives |
| `/tools` | ready | tools hub (ToolsHub) in app shell |
| `/settings` | ready | token bridge + shared Nox primitives applied |
| `/settings/about` | partial | sub-settings surface; matches Settings chrome |
| `/pause` | ready | shared controls + token bridge aligned |
| `/tools/ground` | ready | token bridge aligned (canonical grounding URL) |
| `/tools/ambient` | ready | token bridge aligned |
| `/tools/practice/checkin` | ready | token bridge + form controls aligned |
| `/tools/practice/journal` | ready | token bridge + tag/input alignment in shared flow |

## Batch 2 routes

| Route | Status | Notes |
|---|---|---|
| `/tools/practice/bodyscan` | ready | token bridge active and shared controls aligned |
| `/tools/practice/replay` | ready | token bridge active and shared controls aligned |
| `/admin` | ready | token bridge and shared primitives applied where used |
| `/welcome` | ready | token bridge and semantic color usage aligned |
| `/auth` | ready | token bridge + shared controls aligned |
| `/reset-password` | ready | token bridge + shared controls aligned |
| `/terms` | ready | Nox header + semantic typography alignment |
| `/privacy` | ready | Nox header + semantic typography alignment |
| `/about` | ready | Nox header alignment applied |
| `/blog` | ready | Nox header alignment + semantic typography |
| `/blog/:slug` | ready | Nox header alignment + semantic typography |
| `/roadmap` | ready | public stub (links to blog / about; not full roadmap UI) |
| `/reserve` | ready | Nox header + state-card alignment applied |
| `/not-found` | ready | Nox button and editorial heading alignment |
