# Holzen information architecture (full-IA reference + pause-first notes)

**Scope:** Product-level organization of screens, routes, and primary navigation as implemented in the React app. This complements visual-system work under `docs/design/nox/` and product decisions in `docs/decisions/`.

**Source of truth for URLs:** [active-surface.md](../ops/active-surface.md) (shipped manifest) + `src/App.tsx` (React Router). **Primary nav:** `src/app/components/BottomNav.tsx` + `src/app/components/AppLayout.tsx`. **Layer map:** [client-src-layout.md](../fundamentals/client-src-layout.md).

**Pause-first shipped scope (2026-05):** The **shipped** product on `feature/mvpPauseCleanup` is a **4-tab shell** — Home, Archive, Journey (overview only), Settings — plus full-screen `/pause` and `/companion/*`. Archive MVP = **Pauses + Echoes** only; user **Collections** tab is **not** MVP ([pause-client-architecture.md](../systems/pause-client-architecture.md) §7). Tools, full Journey tabs (stats/badges/activity), Profile gamification, and `/library` are **not** in the active tree (404 on old bookmarks). Recovery snapshot: git tag `full-ia-pre-strip`. Canonical manifest: [docs/ops/active-surface.md](../ops/active-surface.md). **§1 below** still describes the **pre-MVP full IA** for reference when reading legacy code or the archive branch.

**Document status:** **§1–§2** describe the **pre-strip full** shell and routes. **§3** covers gaps from that era. **§4** mixes **pause-first shipped** decisions (§4.5–§4.6) with **full-IA pre-strip reference** (§4.1–§4.4, §4.7) — see the §4 banner before trusting “Shipped” bullets. **§6** is the doc history. *Package/app version* for builds is the Git SHA / `VITE_APP_VERSION` — not duplicated here.

---

## 1. Current model (pre-MVP full IA — reference)

**Route constants and helpers:** `src/lib/app-routes.ts` (`journeyPath`, `toolsLettersPath`, `TOOLS`, `JOURNEY_PREFIX`, `TOOLS_PREFIX`).

### 1.1 Primary navigation (authenticated shell)

Five bottom tabs, all wrapped in `AppLayout` (header + `Outlet` + bottom nav, max width ~24rem mobile-first):


| Tab      | Path            | Role                                                                                                                                                                                                                                                                                        |
| -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home     | `/`             | Hub: draggable widgets (default order **Pause** → **Market** → **Goal** → **Journey pulse** → **Quick capture** → **Evening** when applicable). **Journey pulse** (`HomeJourneyPulse`) surfaces Holzen score + trend, closest badge progress, and links into Journey (stats / badges / activity). **Quick capture** (`HomeQuickCapture`) is a short emotional check-in + optional note (writes `practice_entries`) plus a link to **Archive** with a one-line “recent pause” hint. Pause triggers, onboarding, pull-to-refresh. Full-screen tools (ground, stillness, practice) live under **Tools** — not duplicated as large Home tiles. *Letters are not a Home widget.* |
| Archive  | `/archive`      | Pause history (`v_pause_archive_*`) and favorites scope on the **Pauses** tab. User **collections** UI is not MVP (quarantined in `src/legacy/archive-collections/`). The **chronological activity log** still lives under **Journey → Activity** (`/journey/activity`), which merges pauses, letters, badges, and practice entries in one calendar (`HistoryContent` + `HistoryCalendar`).                                                                                                                                                         |
| Tools    | `/tools`        | In-app index (`ToolsHub`): **one** list to letters, stillness, ground, practice, etc. (no separate “Journey block” on this screen; progress stays under **Journey**). **Ground** opens a full-screen shell with **Session** and **Journal** tabs (`/tools/ground` and `/tools/ground/history`). Only `/tools` and `/tools/letters` use the **shell + bottom nav**; other `/tools/...` routes are full-screen. |
| Journey  | `/journey/:tab` | Longitudinal “you” content: **stats, insights, badges, activity** — each tab is a **path segment** (default `/journey/stats`). *Letters are not a Journey tab.*                                                                                                                             |
| Settings | `/settings`     | **Hub** at `/settings` with links to per-section screens (`/settings/<section>`), plus `/settings/about` and `/settings/billing-history`; `useSettingsModel` only loads for hub and section routes.                                                                                               |


**Letters (Pro):** canonical route `/tools/letters`. Optional query `?letter=<id>` scrolls to that delivered letter.

Notification `action_path` for letter delivery uses `/tools/letters?letter=<id>` (see migrations `20260426010000_letters_tools_action_path.sql` and `20260425200000_journey_routes_notification_paths.sql`). The app does not register `/profile` or alternate pre-`/tools/`* path families.

**Settings sub-routes (still in shell + bottom nav):** `/settings/billing-history`, `/settings/about` (changelog, version, feedback — split out so the main Settings page stays action-first).

**In-app index for tools:** `/tools` lists letters, stillness, ground (journal is the **Journal** tab under `/tools/ground/history`, not a separate hub row), and practice. Stillness is **`/tools/breathe`**. Home exposes **Quick capture** for a minimal check-in; full tools open from the **Tools** tab.

This matches the “skills-first” stats organization documented in `docs/decisions/2026-04-23-skills-first-stats-ia.md` and implemented in `StatsContentV2`.

### 1.2 Routes outside the “primary five tabs” pattern

**A. Full-screen / immersive (no bottom nav)** — `ProtectedRoute` but **not** under `AppLayout`; user returns via back, in-flow CTAs, or home widgets.


| Area              | Routes                                                                                                                | Notes                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Pause session     | `/pause`                                                                                                              | Core guided pause flow.                            |
| Companions        | `/companion/zoom-out/:pauseInstanceId`, `/companion/history/...`, `/companion/signal/...`, `/companion/grounding/...` | Deep-linked to a pause instance.                   |
| Tools (full-screen) | `/tools/breathe`, `/tools/ground` (nested: index + `history` for the grounding journal; shared `ToolsGroundLayout` chrome), `/tools/practice/*` | Regulation / grounding / practice — no bottom nav. |


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

- **Global chrome:** `NotificationBell` (header, `features/notifications/public-hooks`), `FeedbackWidget` (signed-in, `app/components`), `CheckoutConfirmation` (`features/subscription/presentation`, mounted in `AppLayout`), `PauseReadyBanner` on non-Home when auto-trigger fires.
- **Library vs Journey → Activity (full-IA reference):** In pre-strip IA, **Library** was browsable saved items; **Journey → Activity** was the unified log (`HistoryCalendar`). *Not in pause-first bundle.* Shipped Archive = **Pauses + Echoes** only ([active-surface.md](../ops/active-surface.md)).

### 1.7 Primary navigation (product analytics)

- **Pause-first shipped:** `navigation.primary_tab_opened` (PostHog) fires when the user **switches** to a **different** bottom tab (not on re-tap of the current tab, not on back/forward or deep link alone). Property: `tab: 'home' | 'archive' | 'journey' | 'settings'` — see [event-taxonomy.md](../ops/event-taxonomy.md) and `src/app/components/BottomNav.tsx`.
- **Full-IA (pre-strip):** the same event previously used five tabs including `'library'` and `'tools'`; do not reintroduce those enum values without a product decision.
- **Implementation:** `BottomNav.tsx` + `isPrimaryTabActive()` + `APP_SHELL_TABS` in `src/lib/app-routes.ts`.
- **Use for IA decisions:** compare relative tab usage on the **4-tab** shell; full-IA Tools/Library comparisons are historical only.

---

## 2. Assessment: what works (full-IA era — not pause-first shipped)

> **Reference only.** Pause-first shipped shell: [active-surface.md](../ops/active-surface.md). Items below describe the **pre-strip five-tab** product unless noted in §4.

1. **Clear hub:** Home as the main entry for daily use fits a mindfulness + BTC-volatility product.
2. **Full-screen tool separation:** Full-screen routes protect focus (pause, breathe, ground, practice) without fighting the **five-tab** shell.
3. **Deep links for companions:** Instance-scoped URLs are the right pattern for resuming or sharing a specific pause outcome.
4. **Stats skills-first:** Journey’s default-to-stats and skills-first structure is coherent once users land there (see decision doc).
5. **Settings depth:** Hub (`/settings`) plus **per-section routes** (`/settings/<section>`) keeps infrequent tasks out of the daily path; `/settings/about` and `/settings/billing-history` stay first-class without loading the heavy settings model.

---

## 3. Gaps and pain points (IA — full-IA era reference)

> **Reference only.** Not pause-first shipped — see [active-surface.md](../ops/active-surface.md) for live routes. Companion vs `/tools/*` URL families remain valid; **Tools tab and Journey sub-tabs are 404** in the active tree.

1. **Companion URLs vs tools (intentional)**
  Companions use instance-scoped routes under `COMPANION_PREFIX` in `app-routes.ts` (e.g. `/companion/...` per pause) while the regulation / practice / letters namespace is `TOOLS_PREFIX` (`/tools/...`). Two URL families, one mental model each — not a bug to “merge.”
2. **“Journey” still bundles several intents**
  The tab groups stats, insights, badges, and activity. The Activity tab is the single “timeline” surface; further split is a product call.
3. **Progress / history split across three places**
  - Library: saved artifacts and collections.  
  - Journey → activity (chronological log).  
  - Grounding-specific history: **`/tools/ground/history`**, reached from the **Journal** tab inside the Ground full-screen experience (grouped with the session, not a separate “mode” in the tools list).  
   **Mitigation (full-IA):** **Journey → Activity** calendar included **library saves** alongside pauses/practice/badges/letters. Grounding session history was under **Tools → Ground → Journal** (`/tools/ground/history`). *Not in pause-first bundle.*
4. **Settings is multi-purpose**
  Pro, referrals, haptics, push, quiet hours, content sources, danger zone — still a lot to cover, but low-frequency **changelog / version / feedback** is on `/settings/about`, and the main settings experience is a **hub** plus **per-section routes** under `/settings/<section>`.
5. **Discoverability of full-screen tools (full-IA)**
  **Mitigation (full-IA):** **Tools** was a **bottom tab** pointing at `/tools` (`ToolsHub`). *Not in pause-first bundle — `/tools` → 404.*
6. **Marketing vs app boundary**
  Public pages (`/about`, `/blog`, `/reserve`) are consistent; `/roadmap` is a small stub page so inbound links don’t rot or drop users on welcome with no explanation.

---

## 4. Decision status + alternatives

> **Pause-first vs full-IA:** The **live product** matches [active-surface.md](../ops/active-surface.md) — **4 tabs** (Home, Archive, Journey overview, Settings), `/pause`, `/companion/*`. **§4.1–§4.4** and most of **§4.7** describe the **pre-strip full IA** (`git tag full-ia-pre-strip`) for legacy recovery — **not** the active tree (Tools tab, `/journey/:tab`, user collections, Journey → Activity are **404** or legacy). **§4.5–§4.6** remain **pause-first shipped**.

This section captures decision history and what we may reconsider next.

### 4.1 Unify modalities under one parent (full-IA — not pause-first shipped)

- **Full-IA (pre-strip):** canonical `/tools/*` URL family for letters (future self), stillness (`/tools/breathe`), ground (with nested `history` for the grounding journal), practice.
- **Full-IA (pre-strip):** no alternate short routes; external links/bookmarks should use `/tools/...`.
- **Full-IA (pre-strip):** information entry point via `/tools` (`ToolsHub`: **single** list — no “Journey vs immersive” split on that screen) plus Home **Journey pulse** / **Quick capture** entry points.
- **Full-IA (pre-strip):** **Tools** as a **primary bottom tab** (five tabs total) for `/tools` and `/tools/letters` (shell); other full-screen `/tools/...` routes hide the tab bar.
- **Full-IA (pre-strip, measurement):** PostHog `navigation.primary_tab_opened` (see **§1.7**) so tab mix and Tools adoption are quantifiable.
- **Alternative to revisit:** if five tabs feel crowded on small devices, revisit order/labeling or promote tools from Home only — use `navigation.primary_tab_opened` + qualitative feedback (e.g. short hallway tests).

**Pause-first:** `/tools`, `/tools/*`, `/library` → **404** ([active-surface.md](../ops/active-surface.md)).

### 4.2 Split identity/account from progress/archive

- **Pause-first shipped:** Settings section labels use task-oriented wording ([screens/settings](../screens/settings.md)).
- **Pause-first shipped:** Journey tab at **`/journey`** — **overview only** (no `/journey/:tab` sub-routes).
- **Pause-first shipped:** Home widgets are **goal-why**, **market**, **your-pause** only ([screens/home.md](../screens/home.md)).
- **Full-IA (pre-strip):** progress area was **Journey** at `/journey/:tab` (stats, insights, badges, activity — legacy full shell).
- **Full-IA (pre-strip):** Home **Journey pulse** (`HomeJourneyPulse`) and **Quick capture** (`HomeQuickCapture`) widgets.
- **Alternative to revisit:** a **dedicated Stats tab** or heavier Home module only if analytics/interviews show demand; full skills-first **Stats** was the Journey → **Stats** sub-tab in full IA.

### 4.3 Path-addressable Journey (full-IA — not pause-first shipped)

- **Full-IA (pre-strip):** `/journey/:tab` for stats/insights/badges/activity.
- **Full-IA (pre-strip):** letters at `/tools/letters` with optional `?letter=<id>` (delivered letter scroll / notification).
- **Full-IA (pre-strip):** no `location.state` fallback for tab selection.

**Pause-first:** `/journey/stats`, `/journey/:tab`, `/tools/letters` → **404** ([active-surface.md](../ops/active-surface.md)).

### 4.4 Clarify Archive vs Activity

- **Pause-first shipped:** **Archive** = **Pauses + Echoes** tabs only — **no** user Collections tab ([pause-client-architecture.md](../systems/pause-client-architecture.md) §7; UI in `src/legacy/archive-collections/`).
- **Full-IA (pre-strip):** Archive also included **optional user collections**; **Journey → Activity** was a unified chronological log (pauses, practice, badges, letters) in `HistoryCalendar`.
- **Alternative to revisit:** if users still confuse surfaces, merge into one screen with view modes (`saved` / `timeline`) behind one information object.

### 4.5 Settings IA by task (pause-first shipped)

- **Shipped:** task-oriented section groups (Account & profile, Pause behavior, App behavior, Content & data, Notifications & quiet hours, Subscription & Pro, Account & security).
- **Shipped:** `/settings` as a **hub** (jump links; “About & feedback” card with “new” when an unseen changelog version exists); **`settingsSectionPath(id)`** in `app-routes.ts` → `/settings/<id>` for **dedicated section screens** (shared `useSettingsModel` + context). `/settings/about` and `/settings/billing-history` stay first-class routes **without** loading the heavy settings model.
- **Shipped:** on the hub, `#settings-section-<id>` replaces into `/settings/<id>` for deep links from in-page jump links.
- **Further improvement:** optional polish (skeletons per section, focus/scroll), or a **layout pass** on section screen typography/spacing.

### 4.6 Admin IA (pause-first shipped)

- **Shipped:** admin remains isolated under `/admin*` and excluded from consumer navigation.
- **Shipped:** `AdminSubNav` (horizontal links) on `/admin`, `/admin/smoke-test`, `/admin/sentry-alerts`, `/admin/edge-coverage` for quick movement between allowlisted admin screens.
- **Further improvement:** if the admin surface grows, extend the same pattern (or a small layout wrapper) for new `/admin/...` routes.

### 4.7 Summary — open alternatives and improvements (mostly full-IA reference)

Use this as a **checklist** when planning research or another IA pass — **cross-check [active-surface.md](../ops/active-surface.md)** before treating a row as live. Detailed rationale stays in **§3** and **§4.1–§4.6** above.


| Theme                    | Full-IA guardrails (pre-strip)                                       | Pause-first today | Alternatives / improvements to consider                                                                     |
| ------------------------ | -------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------- |
| **Tools & shell**        | Canonical `/tools/*`, single `ToolsHub` list, Ground session+journal in `ToolsGroundLayout`, stillness at `/tools/breathe`; `navigation.primary_tab_opened` | **404** — no Tools tab | Reorder tabs; further merge practice routes if the list still feels long (if full IA returns)                                  |
| **Journey vs "profile"** | `/journey/:tab`, skills-first stats; **Home** shows Journey pulse + quick capture | **`/journey` overview only**; Home = goal/market/pause widgets | Heavier Home module or a **dedicated Stats tab** if interviews + metrics justify it                         |
| **Journey scope**        | One hub: stats, insights, badges, activity; letters under Tools      | Overview only; stats/badges/activity **legacy**      | Further **split tabs or routes** if one area dominates support load (product call)                          |
| **Library vs Activity**  | Library tabs vs Journey → Activity calendar (includes **`library`** events) | Archive **Pauses + Echoes**; no collections MVP; no Activity tab | **Single screen** with `saved` / `timeline` modes if users still mix them up                                |
| **Settings**             | Hub + `/settings/<section>` + `/settings/about` & `/settings/billing-history` | **Same — shipped** | Further **layout polish** on section pages if metrics still show users bail mid-task                          |
| **Admin**                | Isolated `/admin*` + in-page `AdminSubNav` between admin routes        | **Same — shipped** | Deeper **grouping** or layout wrapper if more tools ship there                                              |
| **Companions vs tools**  | `/companion/...` vs `/tools/...`                                     | **`/companion/*` shipped**; `/tools/*` **404** | Keep two families; only consolidate if a future design unifies "instance" vs "tool" mentally                |
| **Research**             | PostHog tab events                                                   | Tab events for **4-tab** shell | Short **hallway tests** or interviews for naming, tab crowding, "where is my past?" — complements analytics |


**Other product analytics** (not IA-specific): see [event-taxonomy.md](../ops/event-taxonomy.md) for the full list — navigation (`navigation.primary_tab_opened`) and many pause/companion/paywall events are **wired**; any row still marked *planned* there is the source of truth.

---

## 5. Related docs


| Doc                                                  | Relevance                                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [ops/active-surface.md](../ops/active-surface.md)    | **Canonical shipped routes/tabs** (pause-first 4-tab shell).                       |
| `docs/decisions/2026-04-23-skills-first-stats-ia.md` | Stats organization inside **Journey** (full-IA era; stats not in pause-first bundle). |
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
| 2026-04-26 | —      | Letters moved to `/tools/letters` (not Journey); Home letter widget removed; DB notification paths use `/tools/letters`.                                                      |
| 2026-04-26 | —      | Doc cleanup: shell vs immersive `/tools/*`; `ToolsHub` journey block; Home `JourneyHomeCard`; Library activity tab; Settings jump nav; `AdminSubNav`.                                      |
| 2026-04-26 | —      | **Code:** `usePauseStatsData` via TanStack Query; `useHoldGoalProfile`; Home `JourneyHomeCard` shows Holzen score + ring when ≥1 completed pause; `COMPANION_PREFIX` in `app-routes`.       |
| 2026-04-27 | —      | Invalidate pause stats cache on pause `completed`; register global `QueryClient`; Settings hash deep links; `settingsSectionPath` in `app-routes`.                       |
| 2026-04-28 | —      | **Settings:** true per-section routes (`/settings/<id>`), hub, `useSettingsModel` + provider layout; `settingsSectionPath` points at `/settings/<id>`; hub hash → section route.          |
| 2026-04-28 | —      | **Tools:** unified `ToolsHub` list (no Journey/activity on hub); **Ground** `ToolsGroundLayout` with Session + Journal; Ambient folded into Stillness at `/tools/breathe`; i18n “Stillness” no parenthetical. |
| 2026-04-29 | —      | Removed legacy client URL aliases (`/journey/letters`, `/settings/section/*`, `/tools/ambient`); letter notifications and docs use **`/tools/letters`** only. |
| 2026-04-30 | —      | **IA doc sync:** Home default widget order + `HomeJourneyPulse` / `HomeQuickCapture`; Library vs Activity wording matches full-IA UI (no Library “Activity” tab, no `HistoryCrossLinks`); Activity log includes **`library`** events. |
| 2026-05-19 | —      | **Pause-first IA reconciliation:** §4 banner; relabel §4.1–§4.7; fix §1.7 PostHog tab enum (`archive` not `library`/`tools`); §2–§3 full-IA banners; stats-system + past-reflections legacy labels; home.md dead section ids; docs/README + hierarchy sync. Canonical routes: [active-surface.md](../ops/active-surface.md). |

When routes, bottom-nav items, or nav-related analytics change, update **[active-surface.md](../ops/active-surface.md)** (canonical shipped manifest), **§1**, **§1.7**, **§4**, **event-taxonomy.md** (if applicable), and a **Changelog** row in the same PR.
