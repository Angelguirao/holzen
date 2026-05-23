# Legacy / undeployed tests (excluded from default CI)

Vitest excludes `src/test/legacy/**` (see `vitest.config.ts`). Tests here cover **undeployed** edges or **removed** UI (`fetch-source-feeds`, stats/badges). Shared edge pure helpers (e.g. grounding citation normalization) live beside `supabase/functions/_shared/*.ts` instead.

Run manually when touching shared edge helpers or recovering legacy code:

```bash
npx vitest run src/test/legacy
```

Some files still import removed `@/lib/stats` or `@/lib/badges` paths — fix imports or treat as archive-only reference.
