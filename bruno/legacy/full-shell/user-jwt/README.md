# User JWT (`SUPABASE_ACCESS_TOKEN`)

Run **`active/auth/01-sign-in-password`** first (collection root). Sign-in / sign-up scripts set **`AUTH_USER_ID`** when the session includes `user.id`.

**Legacy:** These edges are **undeployed** on pause-first production — expect **404**.

| File | Notes |
|------|--------|
| `badge-notify.bru` | Empty `badges` array returns `{ sent: 0 }` without push setup. |
| `suggest-grounding.bru` | Requires `groundingActivities` (non-empty). |
| `suggest-ritual.bru` | Optional `reflectionMessage`. |
| `journal-prompt.bru` | `language` only. |
| `reflection-insights.bru` | **`user_id` must match JWT** — uses `{{AUTH_USER_ID}}`. For **batch** (no `user_id`, all eligible profiles), call with **`SERVICE_CRON_BEARER`** like `service-cron/` — see [`service-cron/README.md`](../service-cron/README.md). |
| `register-push.bru` | `get-vapid-key` action (no subscription object needed). |
| `send-feedback.bru` | `category`: `bug` \| `feature` \| `question`. |
| `generate-wallpaper.bru` | Requires `message`. |
| `record-referral.bru` | Replace `referral_code` with a real code from another user’s profile. |
| `delete-account-DANGEROUS.bru` | **Deletes the signed-in user and data** — use a throwaway test account only. |
