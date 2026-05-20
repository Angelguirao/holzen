# User client architecture (target)

**Status:** scaffold (May 2026) — expand during Phase B slices  
**Audience:** engineers touching `src/features/user/` or Settings profile sections  
**Server authority:** `profiles`, signal preferences, quiet windows — RLS on user rows  
**Template:** [pause-client-architecture.md](pause-client-architecture.md) §9  
**Principles:** [holzen-application-architecture.md](../fundamentals/holzen-application-architecture.md)

---

## 1. Thesis

**User is one bounded context** for profile, preferences, and settings-backed reads/writes. **Notifications** delivery channels are a **separate** context ([notifications-client-architecture.md](notifications-client-architecture.md)); user owns **prefs columns** (e.g. `email_notifications`, quiet hours).

---

## 2. Client rings

| Ring | Owns |
|------|------|
| **Feature** | Profile queries, signal prefs, quiet window rules, `useProfile` |
| **Screens** | Settings sections — forms call `public-hooks` |
| **Notifications (peer)** | Bell UI and push — reads user prefs via settings, does not duplicate profile mutations |

---

## 3. Target interior (`src/features/user/`)

```text
features/user/
  domain/                 # Profile row projection, pref keys
  application/use-cases/
    profile/              # load/update profile fields
    signals/              # signal source preferences
    quiet-windows/        # quiet hour rules
    roadmap/              # roadmap vote reads (if kept in user)
  ports/
    user-profile.ts       # future explicit port
  infrastructure/queries/
  presentation/
    use-profile.ts
  public.ts | public-queries.ts | public-hooks.ts
```

---

## 4. Public API

| Barrel | Purpose |
|--------|---------|
| `public.ts` | Pure helpers, types |
| `public-queries.ts` | Profile / prefs TanStack modules |
| `public-hooks.ts` | `useProfile`, settings-facing hooks |

---

## 5. Non-negotiables

1. **Email notification toggle** stays on **user** profile — not notifications feature.
2. **Settings screens** do not `supabase.from('profiles')` directly.
3. **Do not merge user + notifications** into one feature folder — separate bounded contexts.

---

## 6. Transitional state

See [src/features/user/README.md](../../src/features/user/README.md). Interior less formalized than market/pause — Phase B target.

---

## 7. Related

- [notifications-client-architecture.md](notifications-client-architecture.md) — channel delivery vs user prefs
