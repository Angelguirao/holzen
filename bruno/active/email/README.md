# Email (shipped)

These requests cover the **active** transactional-email surface:

| File | Function | Auth / notes |
| --- | --- | --- |
| `01-preview-transactional-email.bru` | `preview-transactional-email` | Ops bearer: `EMAIL_PREVIEW_SECRET` or `CRON_SECRET` |
| `02-send-transactional-email.bru` | `send-transactional-email` | User JWT works; service-role JWT also works |
| `03-handle-email-unsubscribe-validate.bru` | `handle-email-unsubscribe` | Public token validation (`GET`) |
| `04-handle-email-unsubscribe-confirm.bru` | `handle-email-unsubscribe` | Public token consume (`POST`) |
| `99-process-email-queue-OPS.bru` | `process-email-queue` | **Service-role JWT only** in `SUPABASE_SERVICE_ROLE_JWT` |

## Required env vars

- `SUPABASE_ACCESS_TOKEN` for normal user-JWT requests
- `EMAIL_PREVIEW_SECRET` for template preview
- `EMAIL_UNSUBSCRIBE_TOKEN` for unsubscribe flow smoke
- `SUPABASE_SERVICE_ROLE_JWT` only for queue-drain ops

`handle-email-suppression` is intentionally **not** modeled here because Resend signs it with Svix headers; use a real webhook delivery or replay tool instead.
