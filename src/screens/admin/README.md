# Admin screen

| Path | Role |
|------|------|
| `AdminScreen.tsx` | `/admin` route (requires `useIsAdmin`) |
| `hooks/use-admin-stats.ts` | Dashboard metrics bundle |
| `public-queries.ts` | Re-exports pause + user query factories for admin only |
| `components/` | Ops tools (sources, costs, config, migrations) |

Thin page: `pages/Admin.tsx` → `AdminScreen`.
