# Google OAuth — local development

Holzen uses **Supabase Auth** `signInWithOAuth({ provider: 'google' })` on `/auth`. You can test Google sign-in from **`http://localhost:8080`** in two ways.

## Option A — Local frontend + staging Supabase (fastest)

No Docker auth config. Point Vite at staging and allow localhost in the **staging** dashboard.

1. Copy [.env.staging.example](../../.env.staging.example) → `.env.staging.local` and fill `VITE_SUPABASE_*`.
2. In **holzen-staging** → **Authentication → URL configuration**:
   - **Site URL:** `http://localhost:8080` (while testing locally)
   - **Redirect URLs:** `http://localhost:8080/**`
3. **Authentication → Providers → Google:** enabled with your Google Cloud **Web client** ID + secret.
4. In **Google Cloud Console** (same OAuth client):
   - **Authorized JavaScript origins:** `http://localhost:8080`
   - **Authorized redirect URI:** `https://ksplyxxdvandkwzundql.supabase.co/auth/v1/callback` (copy from the Supabase Google provider page)
5. Run `npm run dev:staging`, open `http://localhost:8080/auth`, click **Continue with Google**.

## Option B — Full local stack (Docker Supabase)

Frontend + auth both run locally. Requires Google credentials in `supabase/.env.local` (see below).

### 1. Google Cloud Console

Create (or reuse) an **OAuth 2.0 Web client**:

| Field | Value |
|-------|--------|
| Authorized JavaScript origins | `http://localhost:8080` |
| Authorized redirect URI | `http://127.0.0.1:55421/auth/v1/callback` |

Holzen’s local API gateway uses port **55421** (not the default `54321`). Confirm with `npm run supabase:status` if you change `[api].port` in `supabase/config.toml`.

### 2. Supabase local secrets

In **`supabase/.env.local`** (already gitignored), set:

```env
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID="<web-client-id>.apps.googleusercontent.com"
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET="<client-secret>"
```

**Where to copy from**

1. **Client ID** — [Supabase staging → Google provider](https://supabase.com/dashboard/project/ksplyxxdvandkwzundql/auth/providers?provider=Google) (same Web client as prod if you reused it), or **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs**.
2. **Client secret** — Only in **Google Cloud** (Supabase does not show it again after save). Use **+ CREATE CREDENTIALS → OAuth client ID → Web application**, or open the existing Holzen Web client → copy secret / reset if lost.

The CLI loads `supabase/.env.local` when you run `npm run supabase:start`.

Verify without printing secrets:

```sh
npm run check:local-google-oauth
```

### 3. Start stack and app

```sh
npm run supabase:stop
npm run supabase:start
```

Copy [.env.localstack.example](../../.env.localstack.example) → `.env.localstack.local`, set the anon key from `npm run supabase:status`, then:

```sh
npm run dev:local
```

Open `http://localhost:8080/auth` → **Continue with Google**.

After editing `supabase/config.toml` auth settings, always **`supabase:stop`** then **`supabase:start`** so GoTrue picks up changes.

### Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| `redirect_uri_mismatch` from Google | Redirect URI must be exactly `http://127.0.0.1:55421/auth/v1/callback` |
| Supabase “redirect URL not allowed” | `supabase/config.toml` `[auth]` `additional_redirect_urls` must include `http://localhost:8080` |
| Button does nothing / provider disabled | Set both `SUPABASE_AUTH_EXTERNAL_GOOGLE_*` in `supabase/.env.local` and restart Docker stack |
| Lands on wrong host after Google | App uses `redirectTo: window.location.origin` — use `localhost:8080`, not `127.0.0.1:8080`, for consistency |

## See also

- [staging-supabase-setup.md](staging-supabase-setup.md) §6 — hosted redirect URLs
- [platform-exit-runbook.md](platform-exit-runbook.md) — production Google provider setup
- [auth-and-referral-system.md](../systems/auth/auth-and-referral-system.md) — session + referral flow after sign-in
