# Nox Parity Board

Status keys:

- `ready`: migrated and verified
- `partial`: migrated core primitives/tokens, needs route polish
- `blocked`: awaiting missing component/asset decision

## Batch 1 routes

| Route | Status | Notes |
|---|---|---|
| `/` | partial | token bridge + primitive updates applied globally |
| `/library` | partial | uses shared primitives; requires final visual QA |
| `/profile` | partial | shared form controls updated |
| `/settings` | partial | shared form controls updated |
| `/pause` | partial | relies on shared buttons/inputs; verify custom blocks |
| `/ground` | partial | token bridge active |
| `/ambient` | partial | token bridge active |
| `/practice/checkin` | partial | token bridge + input updates |
| `/practice/journal` | partial | tag/input pattern moved toward Nox |

## Batch 2 routes

| Route | Status | Notes |
|---|---|---|
| `/practice/bodyscan` | partial | token bridge active |
| `/practice/replay` | partial | token bridge active |
| `/admin` | partial | verify bespoke admin controls |
| `/welcome` | partial | public page, likely bespoke sections remain |
| `/auth` | partial | shared controls updated |
| `/reset-password` | partial | shared controls updated |
| `/terms` | partial | typography tokens active |
| `/privacy` | partial | typography tokens active |
| `/about` | partial | typography tokens active |
| `/blog` | partial | typography tokens active |
| `/blog/:slug` | partial | typography tokens active |
| `/roadmap` | partial | verify custom section styling |
| `/reserve` | partial | verify custom section styling |
