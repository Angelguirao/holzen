# Auth email hook

- **`auth-email-hook-preview`** — `POST .../auth-email-hook/preview` with **`Authorization: Bearer {{LOVABLE_API_KEY}}`** (same secret the Edge function loads from **`LOVABLE_API_KEY`** in the Supabase runtime). Renders HTML for template types: `signup`, `magiclink`, `recovery`, `invite`, `email_change`, `reauthentication`.

The main **`auth-email-hook`** webhook requires a **signed** Lovable payload — not reproducible from Bruno alone.

## Getting `LOVABLE_API_KEY` for Bruno or `supabase functions serve`

The value is **not** in this repository. It is stored as an **Edge Function secret** on your Supabase project (often auto-provisioned by Lovable). You typically **cannot** re-read the plaintext from Supabase after it is set; if you don’t have it anywhere, use **Dashboard → Edge Functions → Secrets** to **set/rotate** a value you control, or obtain it from your team / Lovable. If unavailable, **skip** the preview request — other Bruno folders do not need this variable.

See [../README.md](../README.md) § *LOVABLE_API_KEY — you won’t get it from this repo*.
