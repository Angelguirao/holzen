# Forms: `name` / `id` + `autocomplete` (DevTools a11y)

**Status:** backlog — small UX / accessibility fix.

## Goal

Ensure **form controls** exposed in the Chrome **Issues** panel have a **`name`** or **`id`**, and appropriate **`autocomplete`** where the browser suggests it (e.g. password fields).

## Rationale

After a normal session, DevTools reported:

- **“A form field element should have an id or name attribute”** (count **3**).
- **“An element doesn't have an autocomplete attribute”** (count **1**), with a **verbose** hint for **`current-password`** on a password input.

These are **best-practice** warnings, not runtime failures.

## Direction

- Find the inputs (likely on **`/`** or auth-related surfaces) and add **`id`** + **`htmlFor`** on labels, or **`name`** where appropriate.
- Add **`autocomplete`** on sign-in / account fields per [HTML autofill](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill-detail-tokens) (e.g. `username`, `current-password`).
- Re-check **Issues** after the change.

## Related

- [route-gating.md](route-gating.md) — auth loading surfaces near forms.
