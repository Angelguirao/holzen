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
| `/profile` | ready | token bridge + shared Nox primitives applied |
| `/settings` | ready | token bridge + shared Nox primitives applied |
| `/pause` | ready | shared controls + token bridge aligned |
| `/ground` | ready | token bridge aligned |
| `/ambient` | ready | token bridge aligned |
| `/practice/checkin` | ready | token bridge + form controls aligned |
| `/practice/journal` | ready | token bridge + tag/input alignment in shared flow |

## Batch 2 routes

| Route | Status | Notes |
|---|---|---|
| `/practice/bodyscan` | ready | token bridge active and shared controls aligned |
| `/practice/replay` | ready | token bridge active and shared controls aligned |
| `/admin` | ready | token bridge and shared primitives applied where used |
| `/welcome` | ready | token bridge and semantic color usage aligned |
| `/auth` | ready | token bridge + shared controls aligned |
| `/reset-password` | ready | token bridge + shared controls aligned |
| `/terms` | ready | Nox header + semantic typography alignment |
| `/privacy` | ready | Nox header + semantic typography alignment |
| `/about` | ready | Nox header alignment applied |
| `/blog` | ready | Nox header alignment + semantic typography |
| `/blog/:slug` | ready | Nox header alignment + semantic typography |
| `/roadmap` | ready | Nox header + badge tone mapping applied |
| `/reserve` | ready | Nox header + state-card alignment applied |
| `/not-found` | ready | Nox button and editorial heading alignment |
