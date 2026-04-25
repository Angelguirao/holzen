# Holzen information architecture (current state + recommendations)

**Scope:** Product-level organization of screens, routes, and primary navigation as implemented in the React app. This complements visual-system work under `docs/design/nox/` and product decisions in `docs/decisions/`.

**Source of truth for URLs:** `src/App.tsx` (React Router). **Primary nav:** `src/components/BottomNav.tsx` + `src/components/AppLayout.tsx`.

**Document status:** **§1–§2** describe the **current** shipped shell and routes. **§3–§4** cover gaps, decisions, and alternatives; **§6** is the doc history. *Package/app version* for builds is the Git SHA / `VITE_APP_VERSION` — not duplicated here.

---

## 1. Current model (as shipped)

**Route constants and helpers:** `src/lib/app-routes.ts` (`journeyPath`, `toolsLettersPath`, `TOOLS`, `JOURNEY_PREFIX`, `TOOLS_PREFIX`).

### 1.1 Primary navigation (authenticated shell)

Five bottom tabs, all wrapped in `AppLayout` (header + `Outlet` + bottom nav, max width ~24rem mobile-first):


| Tab      | Path            | Role                                                                                                                                                                                                                                                                                        |
| -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home     | `/`             | Hub: widgets (market, hold goal, pause/reflection, **At a glance** summary — recent library saves, quick emotional check-in, closest badge progress — evening card when applicable), pause triggers, onboarding. Immersive tools (ground, stillness, full practice) live under **Tools**, not as Home widgets. *Letters are not a Home widget.* |
| Library  | `/library`      | Saved pause artifacts, collections, search, source filters; **Activity** tab links to `/journey/activity` for the consolidated log.                                                                                                                                                         |
| Tools    | `/tools`        | In-app index (`ToolsHub`): **one** list to letters, stillness, ground, practice, etc. (no separate “Journey block” on this screen; progress stays under **Journey**). **Ground** opens a full-screen shell with **Session** and **Journal** tabs (`/tools/ground` and `/tools/ground/history`). Only `/tools` and `/tools/letters` use the **shell + bottom nav**; other `/tools/...` routes are full-screen. |
| Journey  | `/journey/:tab` | Longitudinal “you” content: **stats, insights, badges, activity** — each tab is a **path segment** (default `/journey/stats`). *Letters are not a Journey tab.*                                                                                                                             |
| Settings | `/settings`     | **Hub** at `/settings` with links to per-section screens (`/settings/<section>`), plus `/settings/about` and `/settings/billing-history`; `useSettingsModel` only loads for hub and section routes.                                                                                               |


**Letters (Pro):** canonical route `/tools/letters`. Optional query `?letter=<id>` scrolls to that delivered letter. Legacy `/journey/letters?...` redirects to `/tools/letters?...` (query preserved).

Notification `action_path` for letter delivery uses `/tools/letters?letter=<id>` (see migrations `20260426010000_letters_tools_action_path.sql` and `20260425200000_journey_routes_notification_paths.sql`). The app does not register `/profile` or alternate pre-`/tools/`* path families.

**Settings sub-routes (still in shell + bottom nav):** `/settings/billing-history`, `/settings/about` (changelog, version, feedback — split out so the main Settings page stays action-first).

**In-app index for tools:** `/tools` lists letters, stillness, ground (journal is the second tab in that flow, not a separate hub row), and practice. Legacy `/tools/ambient` **redirects** to `/tools/breathe`. Home surfaces a compact check-in in **At a glance**; full tools are reached from the Tools tab.

This matches the “skills-first” stats organization documented in `docs/decisions/2026-04-23-skills-first-stats-ia.md` and implemented in `StatsContentV2`.

### 1.2 Routes outside the “primary five tabs” pattern

**A. Full-screen / immersive (no bottom nav)** — `ProtectedRoute` but **not** under `AppLayout`; user returns via back, in-flow CTAs, or home widgets.


| Area              | Routes                                                                                                                | Notes                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Pause session     | `/pause`                                                                                                              | Core guided pause flow.                            |
| Companions        | `/companion/zoom-out/:pauseInstanceId`, `/companion/history/...`, `/companion/signal/...`, `/companion/grounding/...` | Deep-linked to a pause instance.                   |
| Tools (full-screen) | `/tools/breathe`, `/tools/ground` (nested: index + `history` for the grounding journal; shared `ToolsGroundLayout` chrome), `/tools/practice/`*, legacy `/tools/ambient` → **redirect** to `/tools/breathe` | Regulation / grounding / practice — no bottom nav. |


**B. Same shell as primary tabs (not listed in §1.1 table)** — still `AppLayout` + bottom nav:


| Area             | Routes                     | Notes                                                                 |
| ---------------- | -------------------------- | --------------------------------------------------------------------- |
| Tools (in shell) | `/tools`, `/tools/letters` | `ToolsHub` and **Letters**; bottom **Tools** tab highlights for both. |


### 1.4 Public and semi-public marketing / legal


| Paths                                                  | Access                                                                                                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/welcome`, `/auth`                                    | `PublicOnlyRoute` (signed-out users; signed-in users redirect to `/`).                                                                                                   |
| `/reset-password`                                      | No PublicOnly/Protected wrapper in router — works for auth flows.                                                                                                        |
| `/terms`, `/privacy`, `/about`, `/blog`, `/blog/:slug` | Open.                                                                                                                                                                    |
| `/reserve`                                             | Open (reservation / waitlist style page).                                                                                                                                |
| `/unsubscribe`                                         | Open (email preferences / marketing unsubscribe).                                                                                                                        |
| `/roadmap`                                             | Public **stub** (`RoadmapStub`): explains there is no in-app roadmap yet; links to blog, about, sign-in (avoids redirecting cold traffic to `/welcome` with no context). |


### 1.5 Admin and internal tooling

Under `/admin` and children (`/admin/smoke-test`, `/admin/sentry-alerts`, `/admin/edge-coverage`). Not in bottom nav; suitable for allowlisted operators (`VITE_ADMIN_USER_IDS` pattern per `AGENTS.md`).

### 1.6 Cross-cutting behaviors

- **Global chrome:** `NotificationBell` (header), `FeedbackWidget` (signed-in), `CheckoutConfirmation`, `PauseReadyBanner` on non-Home when auto-trigger fires.
- **Library vs Journey → Activity:** Copy on Library clarifies “saved, browsable” vs chronological log under **Journey → Activity**; product copy lives in i18n (`library.iaClarifier`, `journey.activityExplainer`). A tab-row link (`library.linkActivityLog`) also jumps to **Journey → Activity**. `HistoryCrossLinks` adds “See also” links between Library, Journey → Activity, and `/tools/ground/history` so “where is my past?” routes are one tap apart.

### 1.7 Primary navigation (product analytics)

- `navigation.primary_tab_opened` (PostHog) fires when the user **switches** to a **different** bottom tab (not on re-tap of the current tab, not on back/forward or deep link alone). Property: `tab: 'home' | 'library' | 'tools' | 'journey' | 'settings'`.
- **Implementation:** `src/components/BottomNav.tsx` + `isPrimaryTabActive()`. **Taxonomy:** [docs/ops/event-taxonomy.md](../ops/event-taxonomy.md) § *navigation*.
- **Use for IA decisions:** compare relative tab usage (e.g. **Tools** vs other tabs), spot crowding, and validate follow-ups in **§3** / **§4**.

---

## 2. Assessment: what works

1. **Clear hub:** Home as the main entry for daily use fits a mindfulness + BTC-volatility product.
2. **Full-screen tool separation:** Full-screen routes protect focus (pause, breathe, ground, practice) without fighting the **five-tab** shell.
3. **Deep links for companions:** Instance-scoped URLs are the right pattern for resuming or sharing a specific pause outcome.
4. **Stats skills-first:** Journey’s default-to-stats and skills-first structure is coherent once users land there (see decision doc).
5. **Settings depth:** Accordion / long-page settings is common on mobile; billing as a sub-route is reasonable.

---

## 3. Gaps and pain points (IA)

1. **Companion URLs vs tools (intentional)**
  Companions use instance-scoped routes under `COMPANION_PREFIX` in `app-routes.ts` (e.g. `/companion/...` per pause) while the regulation / practice / letters namespace is `TOOLS_PREFIX` (`/tools/...`). Two URL families, one mental model each — not a bug to “merge.”
2. **“Journey” still bundles several intents**
  The tab groups stats, insights, badges, and activity. Copy and the Library vs Activity explainer help; further split is a product call.
3. **Progress / history split across three places**
  - Library: saved artifacts and collections.  
  - Journey → activity (chronological log).  
  - Grounding-specific history: **`/tools/ground/history`**, reached from the **Journal** tab inside the Ground full-screen experience (grouped with the session, not a separate “mode” in the tools list).  
   **Mitigation shipped:** cross-links (`HistoryCrossLinks`) on Library, Journey → Activity, and Grounding history; the underlying three-surface model remains intentional.
4. **Settings is multi-purpose**
  Pro, referrals, haptics, push, quiet hours, content sources, danger zone — still a lot to cover, but low-frequency **changelog / version / feedback** is on `/settings/about`, and the main settings experience is a **hub** plus **per-section routes** under `/settings/<section>`.
5. **Discoverability of full-screen tools**
  **Mitigation shipped:** **Tools** is a **bottom tab** pointing at `/tools` (`ToolsHub`). Home widgets and deep links remain; full-screen tool routes still hide the shell; `/tools/letters` stays in the shell.
6. **Marketing vs app boundary**
  Public pages (`/about`, `/blog`, `/reserve`) are consistent; `/roadmap` is a small stub page so inbound links don’t rot or drop users on welcome with no explanation.

---

## 4. Decision status + alternatives

This section captures the **current state** and what we may reconsider next.

### 4.1 Unify modalities under one parent

- **Shipped:** canonical `/tools/*` URL family for letters (future self), stillness, ground (with nested `history` for the grounding journal), practice; legacy `/tools/ambient` redirects to `/tools/breathe` (old Ambient page removed).
- **Shipped:** no alternate short routes; external links/bookmarks should use `/tools/...`.
- **Shipped:** information entry point via `/tools` (`ToolsHub`: **single** list — no “Journey vs immersive” split on that screen) plus Home links.
- **Shipped:** **Tools** as a **primary bottom tab** (five tabs total) for `/tools` and `/tools/letters` (shell); other full-screen `/tools/...` routes hide the tab bar.
- **Shipped (measurement):** PostHog `navigation.primary_tab_opened` (see **§1.7**) so tab mix and Tools adoption are quantifiable.
- **Alternative to revisit:** if five tabs feel crowded on small devices, revisit order/labeling or promote tools from Home only — use `navigation.primary_tab_opened` + qualitative feedback (e.g. short hallway tests).

### 4.2 Split identity/account from progress/archive

- **Shipped:** progress area is **Journey** at `/journey/...` (not “Profile” in primary IA).
- **Shipped:** Settings section labels now use task-oriented wording.
- **Shipped:** **At a glance** on Home (`HomeAtAGlance`) — library preview, quick check-in (`practice_entries`), and closest badge progress (same badge snapshots as Journey → Badges), without duplicating the full Holzen score card.
- **Alternative to revisit:** a **dedicated Stats tab** or heavier Home module only if analytics/interviews show demand; full skills-first **Stats** remains the Journey → **Stats** sub-tab.

### 4.3 Path-addressable Journey

- **Shipped:** `/journey/:tab` for stats/insights/badges/activity.
- **Shipped:** letters at `/tools/letters` with optional `?letter=<id>` (delivered letter scroll / notification); legacy `/journey/letters` redirects.
- **Shipped:** no `location.state` fallback for tab selection.

### 4.4 Clarify Library vs Activity

- **Shipped:** in-product explainer copy distinguishes Library (saved/browsable artifacts) vs Journey Activity (chronological log).
- **Alternative to revisit:** if users still confuse surfaces, merge into one screen with view modes (`saved` / `timeline`) behind one information object.

### 4.5 Settings IA by task

- **Shipped:** task-oriented section groups (Account & profile, Pause behavior, App behavior, Content & data, Notifications & quiet hours, Subscription & Pro, Account & security).
- **Shipped:** `/settings` as a **hub** (jump links; “About & feedback” card with “new” when an unseen changelog version exists); **`settingsSectionPath(id)`** in `app-routes.ts` → `/settings/<id>` for **dedicated section screens** (shared `useSettingsModel` + context). `/settings/about` and `/settings/billing-history` stay first-class routes **without** loading the heavy settings model.
- **Shipped (compat):** legacy `/settings/section/<id>` redirects to `/settings/<id>`; on the hub, `#settings-section-<id>` replaces into `/settings/<id>`.
- **Further improvement:** optional polish (skeletons per section, focus/scroll), or a **layout pass** on section screen typography/spacing.

### 4.6 Admin IA

- **Shipped:** admin remains isolated under `/admin*` and excluded from consumer navigation.
- **Shipped:** `AdminSubNav` (horizontal links) on `/admin`, `/admin/smoke-test`, `/admin/sentry-alerts`, `/admin/edge-coverage` for quick movement between allowlisted admin screens.
- **Further improvement:** if the admin surface grows, extend the same pattern (or a small layout wrapper) for new `/admin/...` routes.

### 4.7 Summary — open alternatives and improvements

Use this as a **checklist** when planning research or another IA pass. Detailed rationale stays in **§3** and **§4.1–4.6** above.


| Theme                    | Shipped guardrails                                                   | Alternatives / improvements to consider                                                                     |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Tools & shell**        | Canonical `/tools/*`, single `ToolsHub` list, Ground session+journal in `ToolsGroundLayout`, `/tools/ambient` → breathe; `navigation.primary_tab_opened` | Reorder tabs; further merge practice routes if the list still feels long                                  |
| **Journey vs “profile”** | `/journey/:tab`, skills-first stats; **Home** shows score preview    | Heavier Home module or a **dedicated Stats tab** if interviews + metrics justify it                         |
| **Journey scope**        | One hub: stats, insights, badges, activity; letters under Tools      | Further **split tabs or routes** if one area dominates support load (product call)                          |
| **Library vs Activity**  | Copy + `HistoryCrossLinks`                                           | **Single screen** with `saved` / `timeline` modes if users still mix them up                                |
| **Settings**             | Hub + `/settings/<section>` + `/settings/about` & `/settings/billing-history`; legacy `/settings/section/*` | Further **layout polish** on section pages if metrics still show users bail mid-task                          |
| **Admin**                | Isolated `/admin*` + in-page `AdminSubNav` between admin routes        | Deeper **grouping** or layout wrapper if more tools ship there                                              |
| **Companions vs tools**  | `/companion/...` vs `/tools/...`                                     | Keep two families; only consolidate if a future design unifies “instance” vs “tool” mentally                |
| **Research**             | PostHog tab events                                                   | Short **hallway tests** or interviews for naming, tab crowding, “where is my past?” — complements analytics |


**Other product analytics** (not IA-specific): see [event-taxonomy.md](../ops/event-taxonomy.md) for the full list — navigation (`navigation.primary_tab_opened`) and many pause/companion/paywall events are **wired**; any row still marked *planned* there is the source of truth.

---

## 5. Related docs


| Doc                                                  | Relevance                                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `docs/decisions/2026-04-23-skills-first-stats-ia.md` | Stats organization inside **Journey** (was profile-tab era).                       |
| `docs/systems/pause-system.md`                       | Pause lifecycle; informs companion and `/pause` placement.                         |
| `docs/systems/stats-system.md`                       | Skills-first metrics model.                                                        |
| `docs/design/nox/README.md`                          | Visual system; IA changes should still follow Nox patterns for nav/components.     |
| `AGENTS.md`                                          | Route registration and `App.tsx` conventions.                                      |
| `docs/ops/event-taxonomy.md`                         | `navigation.primary_tab_opened` and other PostHog events (IA-relevant: §1.7 here). |


---

## 6. Changelog


| Date       | Author | Change                                                                                                                                                                                      |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-25 | —      | Initial inventory from `App.tsx` + nav components; gap analysis and recommendations.                                                                                                        |
| 2026-04-25 | —      | Shipped: `/journey/*` (no state-based tabs), `/tools/*` + hub, notifications migration, Library/Activity copy; no legacy profile or pre-`/tools` routes.                                    |
| 2026-04-25 | —      | Updated to a “decision status + alternatives” format to capture current IA, reconsideration options, and further improvements.                                                              |
| 2026-04-25 | —      | Acted on IA: Tools bottom tab; `/settings/about`; `HistoryCrossLinks` across Library / Journey Activity / Grounding history; `/roadmap` stub page.                                          |
| 2026-04-26 | —      | Document **§1.7** nav analytics (`navigation.primary_tab_opened`); fix five-tab wording in **§2**; add **§4.7** consolidated alternatives; link event taxonomy; clarify doc vs app version. |
| 2026-04-26 | —      | Letters moved to `/tools/letters` (not Journey); Home letter widget removed; DB notification paths + redirect from `/journey/letters`.                                                      |
| 2026-04-26 | —      | Doc cleanup: shell vs immersive `/tools/*`; `ToolsHub` journey block; Home `JourneyHomeCard`; Library activity tab; Settings jump nav; `AdminSubNav`.                                      |
| 2026-04-26 | —      | **Code:** `usePauseStatsData` via TanStack Query; `useHoldGoalProfile`; Home `JourneyHomeCard` shows Holzen score + ring when ≥1 completed pause; `COMPANION_PREFIX` in `app-routes`.       |
| 2026-04-27 | —      | Invalidate pause stats cache on pause `completed`; register global `QueryClient`; Settings hash + `/settings/section/:section`; `settingsSectionPath` in `app-routes`.                       |
| 2026-04-28 | —      | **Settings:** true per-section routes (`/settings/<id>`), hub, `useSettingsModel` + provider layout; `settingsSectionPath` points at `/settings/<id>`; legacy path + hash compat.          |
| 2026-04-28 | —      | **Tools:** unified `ToolsHub` list (no Journey/activity on hub); **Ground** `ToolsGroundLayout` with Session + Journal; remove Ambient page (redirect to Stillness); i18n “Stillness” no parenthetical. |


When routes, bottom-nav items, or nav-related analytics change, update **§1**, **§1.7**, **§4.1**, **§4.7**, **event-taxonomy.md** (if applicable), and a **Changelog** row in the same PR.