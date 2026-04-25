# Holzen information architecture (current state + recommendations)

**Scope:** Product-level organization of screens, routes, and primary navigation as implemented in the React app. This complements visual-system work under `docs/design/nox/` and product decisions in `docs/decisions/`.

**Source of truth for URLs:** `src/App.tsx` (React Router). **Primary nav:** `src/components/BottomNav.tsx` + `src/components/AppLayout.tsx`.

**Document status:** **§1–§2** describe the **current** shipped shell and routes. **§4** and **§7** are the canonical place for *alternatives* and *future* improvements; **§6** is the doc history. *Package/app version* for builds is the Git SHA / `VITE_APP_VERSION` — not duplicated here.

---

## 1. Current model (as shipped)

**Route constants and helpers:** `src/lib/app-routes.ts` (`journeyPath`, `toolsLettersPath`, `TOOLS`, `JOURNEY_PREFIX`, `TOOLS_PREFIX`).

### 1.1 Primary navigation (authenticated shell)

Five bottom tabs, all wrapped in `AppLayout` (header + `Outlet` + bottom nav, max width ~24rem mobile-first):

| Tab        | Path          | Role |
|------------|---------------|------|
| Home       | `/`           | Hub: widgets (market, hold goal, reflection, ground entry, night, practice, breathe), pause triggers, onboarding. *Letters are not a Home widget; they live under Tools.* |
| Library    | `/library`    | Saved pause artifacts, collections, search, source filters. |
| Tools      | `/tools`      | In-app index (`ToolsHub`) for **letters to your future self**, breathe, ambient, ground, ground history, practice. Same shell as this tab: **`/tools/letters`**. Other immersive tool routes use `/tools/...` and hide the shell (no bottom nav). |
| Journey    | `/journey/:tab` | Longitudinal “you” content: **stats, insights, badges, activity** — each tab is a **path segment** (default `/journey/stats`). *Letters are not a Journey tab.* |
| Settings   | `/settings`   | Preferences, Pro/checkout, notifications, quiet hours, thresholds, sources, account actions, etc. |

**Letters (Pro):** canonical route **`/tools/letters`**. Optional query **`?letter=<id>`** scrolls to that delivered letter. Legacy **`/journey/letters?...` redirects to **`/tools/letters?...`**.

Notification `action_path` for letter delivery uses **`/tools/letters?letter=<id>`** (see migrations `20260426010000_letters_tools_action_path.sql` and `20260425200000_journey_routes_notification_paths.sql`). The app does not register `/profile` or pre-`/tools/*` paths.

**Settings sub-routes (still in shell + bottom nav):** `/settings/billing-history`, **`/settings/about`** (changelog, version, feedback — split out so the main Settings page stays action-first).

**In-app index for tools:** `/tools` lists letters, breathe, ambient, ground, ground history, and practice — same destinations as the listed `/tools/...` URLs. Linked from Home (Practice + Breathe widgets).

This matches the “skills-first” stats organization documented in `docs/decisions/2026-04-23-skills-first-stats-ia.md` and implemented in `StatsContentV2`.

### 1.2 Full-screen / immersive routes (no bottom nav)

These are `ProtectedRoute` but **not** under `AppLayout` — no persistent primary nav; user returns via back, in-flow CTAs, or home widgets.

| Area | Routes | Notes |
|------|--------|--------|
| Pause session | `/pause` | Core guided pause flow. |
| Companions | `/companion/zoom-out/:pauseInstanceId`, `/companion/history/...`, `/companion/signal/...`, `/companion/grounding/...` | Deep-linked to a pause instance. |
| Tools (canonical) | `/tools/breathe`, `/tools/ambient`, `/tools/ground`, `/tools/ground/history`, `/tools/practice/*` | Single URL family for regulation / grounding / practice. No alternate routes. |

### 1.4 Public and semi-public marketing / legal

| Paths | Access |
|-------|--------|
| `/welcome`, `/auth` | `PublicOnlyRoute` (signed-out users; signed-in users redirect to `/`). |
| `/reset-password` | No PublicOnly/Protected wrapper in router — works for auth flows. |
| `/terms`, `/privacy`, `/about`, `/blog`, `/blog/:slug` | Open. |
| `/reserve` | Open (reservation / waitlist style page). |
| `/unsubscribe` | Open (email preferences / marketing unsubscribe). |
| `/roadmap` | Public **stub** (`RoadmapStub`): explains there is no in-app roadmap yet; links to blog, about, sign-in (avoids redirecting cold traffic to `/welcome` with no context). |

### 1.5 Admin and internal tooling

Under `/admin` and children (`/admin/smoke-test`, `/admin/sentry-alerts`, `/admin/edge-coverage`). Not in bottom nav; suitable for allowlisted operators (`VITE_ADMIN_USER_IDS` pattern per `AGENTS.md`).

### 1.6 Cross-cutting behaviors

- **Global chrome:** `NotificationBell` (header), `FeedbackWidget` (signed-in), `CheckoutConfirmation`, `PauseReadyBanner` on non-Home when auto-trigger fires.
- **Library vs Journey → Activity:** Copy on Library clarifies “saved, browsable” vs chronological log under **Journey → Activity**; product copy lives in i18n (`library.iaClarifier`, `journey.activityExplainer`). **`HistoryCrossLinks`** adds “See also” links between Library, Journey → Activity, and `/tools/ground/history` so “where is my past?” routes are one tap apart.

### 1.7 Primary navigation (product analytics)

- **`navigation.primary_tab_opened`** (PostHog) fires when the user **switches** to a **different** bottom tab (not on re-tap of the current tab, not on back/forward or deep link alone). Property: `tab: 'home' | 'library' | 'tools' | 'journey' | 'settings'`.
- **Implementation:** `src/components/BottomNav.tsx` + `isPrimaryTabActive()`. **Taxonomy:** [docs/ops/event-taxonomy.md](../ops/event-taxonomy.md) § *navigation*.
- **Use for IA decisions:** compare relative tab usage (e.g. **Tools** vs other tabs), spot crowding, and validate follow-ups in **§4** / **§7**.

---

## 2. Assessment: what works

1. **Clear hub:** Home as the main entry for daily use fits a mindfulness + BTC-volatility product.
2. **Immersive separation:** Full-screen routes protect focus (pause, breathe, ground, practice) without fighting the **five-tab** shell.
3. **Deep links for companions:** Instance-scoped URLs are the right pattern for resuming or sharing a specific pause outcome.
4. **Stats skills-first:** Journey’s default-to-stats and skills-first structure is coherent once users land there (see decision doc).
5. **Settings depth:** Accordion / long-page settings is common on mobile; billing as a sub-route is reasonable.

---

## 3. Gaps and pain points (IA)

1. **Companion URLs vs tools**  
   Companions remain under `/companion/...` (per pause instance) while **tools** use `/tools/...` — two honest families; naming is clearer than the old scatter of top-level paths.

2. **“Journey” still bundles several intents**  
   The tab groups stats, insights, badges, and activity. Copy and the Library vs Activity explainer help; further split is a product call.

3. **Progress / history split across three places**  
   - Library: saved artifacts and collections.  
   - Journey → activity (chronological log).  
   - `/tools/ground/history` for grounding-specific history.  
   **Mitigation shipped:** cross-links (`HistoryCrossLinks`) on Library, Journey → Activity, and Grounding history; the underlying three-surface model remains intentional.

4. **Settings is long and multi-purpose**  
   Pro, referrals, haptics, push, quiet hours, content sources, danger zone — still a lot on one page, but low-frequency **changelog / version / feedback** moved to **`/settings/about`** with task-oriented grouping on the main page.

5. **Discoverability of immersive tools**  
   **Mitigation shipped:** **Tools** is a **bottom tab** pointing at `/tools` (`ToolsHub`). Home widgets and deep links remain; full-screen tool routes still hide the shell.

6. **Marketing vs app boundary**  
   Public pages (`/about`, `/blog`, `/reserve`) are consistent; **`/roadmap`** is a small stub page so inbound links don’t rot or drop users on welcome with no explanation.

---

## 4. Decision status + alternatives

This section captures the **current state** and what we may reconsider next.

### 4.1 Unify modalities under one parent

- **Shipped:** canonical **`/tools/*`** prefix for letters (future self), breathe, ambient, ground, ground history, and practice.
- **Shipped:** no alternate short routes; external links/bookmarks should use `/tools/...`.
- **Shipped:** information entry point via **`/tools`** (`ToolsHub`) plus Home links (“Browse all tools & experiences”).
- **Shipped:** **Tools** as a **primary bottom tab** (five tabs total) for the hub URL only; immersive `/tools/...` stays full-screen.
- **Shipped (measurement):** PostHog **`navigation.primary_tab_opened`** (see **§1.7**) so tab mix and Tools adoption are quantifiable.
- **Alternative to revisit:** if five tabs feel crowded on small devices, revisit order/labeling or promote tools from Home only — use **`navigation.primary_tab_opened`** + qualitative feedback (e.g. short hallway tests).

### 4.2 Split identity/account from progress/archive

- **Shipped:** progress area is **Journey** at `/journey/...` (not “Profile” in primary IA).
- **Shipped:** Settings section labels now use task-oriented wording.
- **Alternative to revisit:** promote a compact stats summary to Home, or create a top-level Stats tab, only if product analytics/user interviews show demand.

### 4.3 Path-addressable Journey

- **Shipped:** `/journey/:tab` for stats/insights/badges/activity.
- **Shipped:** letters at **`/tools/letters`** with optional **`?letter=<id>`** (delivered letter scroll / notification); legacy **`/journey/letters`** redirects.
- **Shipped:** no `location.state` fallback for tab selection.

### 4.4 Clarify Library vs Activity

- **Shipped:** in-product explainer copy distinguishes Library (saved/browsable artifacts) vs Journey Activity (chronological log).
- **Alternative to revisit:** if users still confuse surfaces, merge into one screen with view modes (`saved` / `timeline`) behind one information object.

### 4.5 Settings IA by task

- **Shipped:** task-oriented section headers (Account & profile, Pause behavior, App behavior, Content & data, Notifications & quiet hours, Subscription & Pro, Account & security).
- **Shipped:** **`/settings/about`** — changelog, version, feedback (linked from the bottom of Settings; “new” badge when an unseen changelog version exists).
- **Further improvement:** consider splitting Settings into 2-level IA (overview + detail pages) if the accordion grows.

### 4.6 Admin IA

- **Shipped:** admin remains isolated under `/admin*` and excluded from consumer navigation.
- **Further improvement:** if admin surface grows, add grouped internal navigation only within `/admin`.

### 4.7 Summary — open alternatives and improvements

Use this as a **checklist** when planning research or another IA pass. Detailed rationale stays in **§3** and **§4.1–4.6** above.

| Theme | Shipped guardrails | Alternatives / improvements to consider |
|--------|-------------------|----------------------------------------|
| **Tools & shell** | Canonical `/tools/*`, Tools hub tab, `navigation.primary_tab_opened` | Reorder tabs; drop back to four tabs and surface Tools only from Home; A/B or cohort review of tab events |
| **Journey vs “profile”** | `/journey/:tab`, skills-first stats | Compact **stats on Home**; dedicated **Stats** tab if interviews + metrics justify it |
| **Journey scope** | One hub: stats, insights, badges, activity; letters under Tools | Further **split tabs or routes** if one area dominates support load (product call) |
| **Library vs Activity** | Copy + `HistoryCrossLinks` | **Single screen** with `saved` / `timeline` modes if users still mix them up |
| **Settings** | Task sections + `/settings/about` | **Two-level IA** (overview → detail routes) if accordion length hurts completion |
| **Admin** | Isolated `/admin*` | **Grouped in-app nav** under `/admin` if more tools ship there |
| **Companions vs tools** | `/companion/...` vs `/tools/...` | Keep two families; only consolidate if a future design unifies “instance” vs “tool” mentally |
| **Research** | PostHog tab events | Short **hallway tests** or interviews for naming, tab crowding, “where is my past?” — complements analytics |

**Other product analytics** (not IA-specific): many flows in [event-taxonomy.md](../ops/event-taxonomy.md) remain *planned* (e.g. reflection, paywall) — separate from navigation instrumentation.

---

## 5. Related docs

| Doc | Relevance |
|-----|------------|
| `docs/decisions/2026-04-23-skills-first-stats-ia.md` | Stats organization inside **Journey** (was profile-tab era). |
| `docs/systems/pause-system.md` | Pause lifecycle; informs companion and `/pause` placement. |
| `docs/systems/stats-system.md` | Skills-first metrics model. |
| `docs/design/nox/README.md` | Visual system; IA changes should still follow Nox patterns for nav/components. |
| `AGENTS.md` | Route registration and `App.tsx` conventions. |
| `docs/ops/event-taxonomy.md` | **`navigation.primary_tab_opened`** and other PostHog events (IA-relevant: §1.7 here). |

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-25 | — | Initial inventory from `App.tsx` + nav components; gap analysis and recommendations. |
| 2026-04-25 | — | Shipped: `/journey/*` (no state-based tabs), `/tools/*` + hub, notifications migration, Library/Activity copy; no legacy profile or pre-`/tools` routes. |
| 2026-04-25 | — | Updated to a “decision status + alternatives” format to capture current IA, reconsideration options, and further improvements. |
| 2026-04-25 | — | Acted on IA: Tools bottom tab; `/settings/about`; `HistoryCrossLinks` across Library / Journey Activity / Grounding history; `/roadmap` stub page. |
| 2026-04-26 | — | Document **§1.7** nav analytics (`navigation.primary_tab_opened`); fix five-tab wording in **§2**; add **§4.7** consolidated alternatives; link event taxonomy; clarify doc vs app version. |
| 2026-04-26 | — | Letters moved to **`/tools/letters`** (not Journey); Home widget removed; DB notification paths + redirect from **`/journey/letters`**. |

When routes, bottom-nav items, or nav-related analytics change, update **§1**, **§1.7**, **§4.1**, **§4.7**, **event-taxonomy.md** (if applicable), and a **Changelog** row in the same PR.
