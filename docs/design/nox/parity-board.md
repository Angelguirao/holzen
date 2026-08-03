# Nox parity board

Track design-system adoption per route. Update when a screen uses tokens only (no hardcoded hex).

| Route / surface | Status | Notes |
|-----------------|--------|-------|
| `/welcome` (SPA Make) | ✅ tokens | Port of Figma Make; Nox-aligned palette |
| Auth / sign-in | 🟡 partial | Highlight hex removed; shadcn forms |
| Home | 🟡 partial | Market widget uses tokens |
| Pause flows | ✅ tokens | shadcn + Nox bridge |
| Archive | 🟡 partial | Pause items label uses tokens |
| Legacy SPA landing | ⏸ legacy | `src/legacy/marketing-landing-spa` — not shipped |

**Legend:** ✅ tokens only · 🟡 mixed · ⏸ legacy quarantine
