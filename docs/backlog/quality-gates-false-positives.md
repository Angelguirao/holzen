# Quality gates: false rejects and localization (Pending)

## Context (from Phase 5)

`supabase/functions/_shared/quality.ts` applies **centralized** checks: banned phrases, crypto wording, per-companion word ranges, **specificity regexes** (e.g. grounding expects patterns like year + researcher), sentence diversity.

## Current problem

Strict **English-centric** or **format-specific** patterns can **reject valid** output when:

- content is **non-English** or mixed-language,
- users or models produce **short** or **unusual** but acceptable phrasing,
- prompts change and outputs no longer match legacy regex expectations.

## Implications if we leave it as-is

- Higher **regeneration** loops and cost.
- Poor experience for locales or writing styles that rarely match the patterns.

## Proposed improvement

1. **Measure**: log or sample **reject reasons** from quality gate (without PII) to see top false-positive buckets.
2. **Tune**: relax or locale-gate specific regexes; consider `language` from profile in orchestration.
3. **Document** which gates are **hard** vs **soft** (retry vs permanent reject).

## Related code pointers

- `supabase/functions/_shared/quality.ts`
- Companion generators that call `checkQuality` / equivalent

## Acceptance criteria / how to verify

1. False-reject rate drops for supported locales or content types after tuning (A/B or before/after sample).
2. Product agrees on minimum bar for "specificity" vs inclusivity.
