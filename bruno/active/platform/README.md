# Platform (shipped)

| File | Function | Notes |
| --- | --- | --- |
| `health.bru` | `health` | No user JWT |
| `send-feedback.bru` | `send-feedback` | User JWT |
| `register-push.bru` | `register-push` | User JWT |
| `record-referral.bru` | `record-referral` | User JWT; use a real referral code |
| `delete-account-DANGEROUS.bru` | `delete-account` | **Deletes signed-in user** — throwaway account only |

Run **`../auth/01-sign-in-password`** before user-JWT requests.
