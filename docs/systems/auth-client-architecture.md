# Auth client architecture (target)

**Status:** scaffold (May 2026) — expand during Phase B slices  
**Audience:** engineers touching `src/features/auth/` or auth routes  
**Server authority:** [auth-and-referral-system.md](auth/auth-and-referral-system.md) (Supabase Auth, RLS, referral side effects)  
**Template:** [pause-client-architecture.md](pause-client-architecture.md) §9  
**Principles:** [holzen-application-architecture.md](../fundamentals/holzen-application-architecture.md)

---

## 1. Thesis

**Auth is one bounded context** for session lifecycle and identity projection. Sign-in UI lives in **screens**; session state is exported via **`AuthProvider` / `useAuth`**.

---

## 2. Client rings

| Ring | Owns |
|------|------|
| **Feature** | Session provider, signed-in side effects (welcome email, referral queue) |
| **App** | Mounts `AuthProvider` at root |
| **Screens** | Auth routes (login, recovery) — forms and layout only |

---

## 3. Target interior (`src/features/auth/`)

```text
features/auth/
  domain/                 # AuthSessionState, session vocabulary
  application/use-cases/
    sign-in/              # funnel events, observability
    recovery/             # password reset flows
    referral/             # client triggers for referral side effects (if any)
  ports/
    session.ts            # SessionPort — expand for adapter split
  infrastructure/
    auth-signed-in-side-effects.ts
  presentation/
    AuthProvider.tsx
  public.ts               # AuthProvider, useAuth, AuthSessionState
```

---

## 4. Public API

| Barrel | Purpose |
|--------|---------|
| `public.ts` | `AuthProvider`, `useAuth`, session types — **only** cross-context import surface |
| `public-hooks.ts` | *(optional)* if hooks split from public.ts |
| `public-queries.ts` | *(rare)* if auth-related reads grow beyond session |

**Rule:** `App.tsx` and routes import `@/features/auth/public` only — not `presentation/AuthProvider` directly.

---

## 5. Non-negotiables

1. **Session truth** — Supabase Auth; client does not invent logged-in state.
2. **Side effects** — welcome email / referral queue in infrastructure, triggered from provider lifecycle — not scattered in screens.
3. **No auth logic in pause** — pause reads `useAuth` for user id; pause does not own credentials.

---

## 6. Transitional state

See [src/features/auth/README.md](../../src/features/auth/README.md). `ports/session.ts` is scaffold-only.

---

## 7. Related

- [docs/systems/routing/route-gating-system.md](routing/route-gating-system.md) — `ProtectedRoute` / `PublicOnlyRoute`
