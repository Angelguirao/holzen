# Auth email hook

- **`auth-email-hook-preview`** — `POST .../auth-email-hook/preview` with **`Authorization: Bearer {{LOVABLE_API_KEY}}`** (same secret the Edge function uses). Renders HTML for template types: `signup`, `magiclink`, `recovery`, `invite`, `email_change`, `reauthentication`.

The main **`auth-email-hook`** webhook requires a **signed** Lovable payload — not reproducible from Bruno alone.
