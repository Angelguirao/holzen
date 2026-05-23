## Summary

<!-- What changed and why -->

## Test plan

- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Lint touched files

### Backend (migrations or edge functions)

- [ ] `npm run supabase:reset` (local Docker) or reviewed SQL manually
- [ ] `npm run check:view-migrations` (if views changed)
- [ ] `npm run check:edge` (if Deno available)
- [ ] `npm run staging:db-push` against **owned staging** project (not Lovable prod sync)
- [ ] Smoke: sign-in, one pause flow, one edge call (Bruno or app)

### Observability (if frontend/edge logging touched)

- [ ] PostHog taxonomy / feature flags docs updated when applicable
- [ ] Lovable or Supabase secrets parity noted in PR description
