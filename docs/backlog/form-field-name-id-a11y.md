# Forms: `name` / `id` + `autocomplete` (DevTools a11y)

**Status:** shipped (2026-04).

## What shipped

- **`Auth.tsx`:** Distinct ids per view (`auth-forgot-email`, `auth-email`, `auth-password`); **`name`** on fields; **`autoComplete`**: `email` (reset), `email` / `username` (sign-up vs sign-in), `new-password` / `current-password` for password.
- **`ResetPassword.tsx`:** **`reset-password-new`** / **`reset-password-confirm`** ids; **`name`**; **`autoComplete="new-password"`** on both password fields.
- **`OnboardingWelcome.tsx`:** **`Label`** + **`onboarding-first-name`** id; **`name="given-name"`**, **`autoComplete="given-name"`**.
- **`Settings.tsx`:** First name, change-email, and account password fields: ids, **`name`**, appropriate **`autoComplete`**.
- **`Library.tsx`:** Search: **`id="library-search"`**, **`name="q"`**, **`type="search"`**, **`autoComplete="off"`**, **`aria-label`**.
- **`HoldGoalWidget.tsx`:** Goal value input: **`id`**, **`name`**, **`autoComplete="off"`**.

Re-check Chrome **Issues** after deploy if new surfaces are added.

## Related

- [route-gating.md](route-gating.md) — auth loading surfaces near forms.
