# Holzen information architecture (current state + recommendations)

**Scope:** Product-level organization of screens, routes, and primary navigation as implemented in the React app. This complements visual-system work under `docs/design/nox/` and product decisions in `docs/decisions/`.

**Source of truth for URLs:** `src/App.tsx` (React Router). **Primary nav:** `src/components/BottomNav.tsx` + `src/components/AppLayout.tsx`.

---

## 1. Current model (as shipped)

### 1.1 Primary navigation (authenticated shell)

Four bottom tabs, all wrapped in `AppLayout` (header + `Outlet` + bottom nav, max width ~24rem mobile-first):

| Tab        | Path          | Role |
|------------|---------------|------|
| Home       | `/`           | Hub: widgets (market, hold goal, reflection, ground entry, night, letter, practice, breathe), pause triggers, onboarding. |
| Library    | `/library`    | Saved pause artifacts, collections, search, source filters. |
| Profile    | `/profile`    | **Container for “me” content:** internal tabs (see below) — not separate routes. |
| Settings   | `/settings`   | Preferences, Pro/checkout, notifications, quiet windows, thresholds, sources, account actions, etc. |

Billing history is nested: `/settings/billing-history` (still under the authenticated shell with bottom nav).

### 1.2 Profile: secondary IA (in-page tabs)

`Profile` uses **location state** for tab selection (`parseProfileLocationState` in `src/lib/router-location-state.ts`), not path segments. Tabs: **stats, insights, badges, letters, activity**. Default when opening Profile is **stats** (see `Profile.tsx`).

This matches the “skills-first” stats organization documented in `docs/decisions/2026-04-23-skills-first-stats-ia.md` and implemented in `StatsContentV2`.

### 1.3 Full-screen / immersive routes (no bottom nav)

These are `ProtectedRoute` but **not** under `AppLayout` — no persistent primary nav; user returns via back, in-flow CTAs, or home widgets.

| Area | Routes | Notes |
|------|--------|--------|
| Pause session | `/pause` | Core guided pause flow. |
| Companions | `/companion/zoom-out/:pauseInstanceId`, `/companion/history/...`, `/companion/signal/...`, `/companion/grounding/...` | Deep-linked to a pause instance. |
| Regulation / body | `/breathe`, `/ambient` | Calming / sound-style experiences. |
| Grounding | `/ground`, `/ground/history` | Distinct from “Ground” widget on Home that routes here. |
| Practice | `/practice/checkin`, `/practice/journal`, `/practice/bodyscan`, `/practice/replay` | Named “practice” in URL; overlaps semantically with Profile “activity” and Home “practice” widget. |

### 1.4 Public and semi-public marketing / legal

| Paths | Access |
|-------|--------|
| `/welcome`, `/auth` | `PublicOnlyRoute` (signed-out users; signed-in users redirect to `/`). |
| `/reset-password` | No PublicOnly/Protected wrapper in router — works for auth flows. |
| `/terms`, `/privacy`, `/about`, `/blog`, `/blog/:slug` | Open. |
| `/reserve` | Open (reservation / waitlist style page). |
| `/unsubscribe` | Open (email preferences / marketing unsubscribe). |
| `/roadmap` | Redirects to `/welcome` (roadmap not a live route in app shell). |

### 1.5 Admin and internal tooling

Under `/admin` and children (`/admin/smoke-test`, `/admin/sentry-alerts`, `/admin/edge-coverage`). Not in bottom nav; suitable for allowlisted operators (`VITE_ADMIN_USER_IDS` pattern per `AGENTS.md`).

### 1.6 Cross-cutting behaviors

- **Global chrome:** `NotificationBell` (header), `FeedbackWidget` (signed-in), `CheckoutConfirmation`, `PauseReadyBanner` on non-Home when auto-trigger fires.
- **Library vs Profile:** Library is the **canonical browse/search** of saved items; Profile tab **activity** and embedded **History** patterns can feel adjacent to Library — see gaps below.

---

## 2. Assessment: what works

1. **Clear hub:** Home as the main entry for daily use fits a mindfulness + BTC-volatility product.
2. **Immersive separation:** Full-screen routes protect focus (pause, breathe, ground, practice) without fighting the four-tab model.
3. **Deep links for companions:** Instance-scoped URLs are the right pattern for resuming or sharing a specific pause outcome.
4. **Stats skills-first:** Profile’s default-to-stats and skills-first structure is coherent once users land there (see decision doc).
5. **Settings depth:** Accordion / long-page settings is common on mobile; billing as a sub-route is reasonable.

---

## 3. Gaps and pain points (IA)

1. **Naming inconsistency across URL groups**  
   `/practice/*`, `/ground/*`, `/breathe`, `/ambient`, and companion `/companion/*` don’t read as one family. New users and contributors both have to learn several top-level “buckets” that overlap emotionally (all are “ways to regulate / reflect”).

2. **“Profile” is overloaded**  
   The word suggests account and identity, but the tab is mostly **longitudinal self view**: stats, insights, badges, letters, activity. That mixes **outcomes** (stats/badges) with **archives** (letters, activity) under one label. Settings already holds real account and prefs — so “Profile” vs “Settings” mental model can blur.

3. **Progress / history split across three places**  
   - Library: saved artifacts and collections.  
   - Profile → activity (and history-related UI).  
   - `/ground/history` for grounding-specific history.  
   Users asking “where is my past?” may try more than one surface.

4. **Profile tabs are not URL-first**  
   Tabs driven by `location.state` are fine for notification deep links but **not bookmarkable** and harder to reason about in analytics (“which tab?” often not in the path). Same route `/profile` for five different primary intents.

5. **Settings is long and multi-purpose**  
   Pro, referrals, haptics, push, quiet hours, content sources, danger zone, changelog — it’s a **catch-all** “everything else,” which is practical but can feel like the junk drawer if not grouped with strong section IA inside the page.

6. **Discoverability of immersive tools**  
   Breathe, ambient, ground, and practice are primarily reached from **Home widgets** and cross-links, not the bottom nav. That keeps the tab bar small but hides secondary modalities unless Home is configured to surface them.

7. **Marketing vs app boundary**  
   Public pages (`/about`, `/blog`, `/reserve`) are consistent; `/roadmap` redirect suggests roadmap content may return — worth tracking so external links don’t rot.

---

## 4. Recommended directions (non-prescriptive)

These are **directional** improvements; any change should be paired with nav affordances, i18n, and analytics (see `docs/ops/event-taxonomy.md`).

### 4.1 Unify “modalities” under one conceptual parent

**Option A — URL structure:** Introduce a single prefix, e.g. `/do/*` or `/tools/*` (`/do/breathe`, `/do/ground`, `/do/ground/history`, `/do/practice/...`), with redirects from old paths for compatibility.

**Option B — Information-only:** Keep URLs flat but add a **single “Tools” or “Guides”** entry on Home (or a fifth tab) that lists breathe, ground, practice, ambient with one-line intent — reducing reliance on widget order.

### 4.2 Split “identity / account” from “progress & archive”

- **Rename or reframe the Profile tab** in product copy: e.g. “You,” “Journey,” or “Progress,” so it doesn’t compete with Settings for “account.”  
- Alternatively, **move high-value progress** (e.g. stats summary) to Home or a dedicated top-level “Stats” tab **only if** user research shows users expect a direct tab for numbers — otherwise keep density on Profile and improve labeling.

### 4.3 Make Profile secondary sections path-addressable (optional but high leverage)

- Use nested routes: `/profile/stats`, `/profile/badges`, … or query params: `/profile?tab=stats` (shareable, analytics-friendly) instead of or in addition to `location.state`.  
- Preserves a single “me” area while making deep links and back/forward unambiguous.

### 4.4 Clarify Library vs “activity”

- Expose a **single sentence** in-product: Library = *curated saved artifacts*; Activity = *chronological practice/pause log* (or whatever the product truth is).  
- If two lists duplicate content, consider **one list with view modes** rather than two mental models.

### 4.5 Triage Settings by task, not by implementation

- Group into **Account & security**, **Subscription & Pro**, **Notifications & quiet hours**, **Content & data**, **App behavior** (haptics, install PWA) — with optional **Dev / About** last.  
- Consider moving **low-frequency** items (changelog, deep FAQ) to Settings footer or a “About Holzen” subpage linked from Settings.

### 4.6 Admin IA

- Keep admin routes as today; if the surface grows, use **sidebar or grouped links** on `/admin` only — never surface in consumer nav.

---

## 5. Related docs

| Doc | Relevance |
|-----|------------|
| `docs/decisions/2026-04-23-skills-first-stats-ia.md` | Stats organization inside Profile. |
| `docs/systems/pause-system.md` | Pause lifecycle; informs companion and `/pause` placement. |
| `docs/systems/stats-system.md` | Skills-first metrics model. |
| `docs/design/nox/README.md` | Visual system; IA changes should still follow Nox patterns for nav/components. |
| `AGENTS.md` | Route registration and `App.tsx` conventions. |

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-25 | — | Initial inventory from `App.tsx` + nav components; gap analysis and recommendations. |

When routes or bottom-nav items change, update **Section 1** and the **Changelog** row in the same PR.
