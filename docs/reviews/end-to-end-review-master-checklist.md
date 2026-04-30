# End-to-end review — master checklist

**Purpose:** One place to tick through a **full product review** of Holzen: routes, flows, cross-cutting concerns, edge functions, and the phased security docs. Use it with:

- **Workflow:** [`.cursor/skills/holzen-flow-review/SKILL.md`](../../.cursor/skills/holzen-flow-review/SKILL.md) (Cursor) — orient → pick scope → trace flow → template.
- **Per session:** [react-spa-review-template.md](react-spa-review-template.md) (PR checklist or audit sections).
- **Estimates and narrative:** [full-app-review-backlog.md](full-app-review-backlog.md).

**How to use:** Check `[ ]` → `[x]` when that **slice** is done (flow traced, notes captured, follow-ups filed). Prefer **one vertical slice per session** (e.g. “Home cold load + first pause trigger”) over skimming every box in a day.

**Route source of truth:** `src/App.tsx` (last reconciled with this doc as a structural inventory). **Edge names:** `supabase/config.toml` `[functions.*]` and [bruno/functions-catalog.md](../../bruno/functions-catalog.md).

---

## 0 — Prerequisites (read once, then spot-check)

- [ ] [phase-1-frontend-routing-auth.md](phase-1-frontend-routing-auth.md) — routing, `ProtectedRoute` / `PublicOnlyRoute`, `AuthProvider`, session semantics
- [ ] [phase-2-manual-pause-pipeline.md](phase-2-manual-pause-pipeline.md) — manual pause pipeline (before deep `/pause` + companion contract work)
- [ ] [phase-3-server-cron-triggers.md](phase-3-server-cron-triggers.md) through [phase-8-rls-hardening-service-role-policies.md](phase-8-rls-hardening-service-role-policies.md) — **before claiming production readiness** (can run in parallel with UI tiers)

---

## 1 — Tier A — Daily path (shell, home, library, journey, settings)

### Global shell (under `AppLayout` + shared providers)

- [x] `AppLayout` / `BottomNav` / main chrome — *L1 2026-04-30: layout mounts `useHolzen` for `language` + `useAutoTrigger`; inner `Suspense` + `PageChunkFallback` (a11y status); tab chunk prefetch idle/timeout.*
- [x] `NotificationBell` + notification deep links (if any) — *L1: header placement; deep links deferred to dedicated notification pass.*
- [x] `PauseReadyBanner` + interaction with pause entry — *L1: `pauseReady`/`dismiss` from `useAutoTrigger`; shown when `!isHome`.*
- [x] `useLanguageSync` / locale behavior — *L1: `useLanguageSync(language)` from profile; i18n `changeLanguage` only for supported resource keys.*
- [x] `OfflineBanner`, `CookieConsent`, `ScrollToTop`, `Sonner` (as relevant to flows you test) — *L1: `App.tsx` wiring; `ScrollToTop` on pathname; Sonner inside `TooltipProvider`.*
- [x] `ErrorBoundary` + `FeedbackWidgetGate` (signed-in only) — *L1: root boundary; feedback only when `useAuth().user`.*
- [x] `RouterLocationLog` / routing instrumentation (sanity: no PII leaks) — *L1: logs pathname, authLoading, signedIn, `user?.id?.slice(0,8)` only.*
- [x] `CheckoutGuardCleanup` (checkout return UX) — *L1: `scheduleCheckoutGuardCleanup` on mount; covered by `src/test/checkout-guard-cleanup.test.ts`.*

### Home

- [x] `/` — `Home` (widgets: pause-first, market, goal, journey pulse, quick capture, evening, onboarding, ordering, pull-to-refresh, query params e.g. `subscribed`) — *L2 2026-04-30: `profileLoaded` → `AuthLoading`; onboarding gate; `useHolzen` + `useSubscription` + outlet `pauseReady` → `refreshProfile`; `?subscribed=true` → `refresh` + toast; zen branch mirrors loading/error/limit UI; widget mode has DnD layout + reflection/BTC/journey-pulse/quick-capture/night widgets + categorized `error` / `isPausePersistError` + navigate `/pause` with location state; pull-to-refresh = full `reload`; local-only `supabase` reads for pinned preview + completed count (extra coupling vs central hook).*
- [x] `/index` → redirect to `/` (smoke) — *L2: `App.tsx` `<Navigate to="/" replace />`.*

### Library

- [x] `/library` — `Library` — *L3 2026-04-30: `useProGate` → pending skeleton / non-Pro lock + checkout; Pro path uses `useLibrary` (Supabase `library_items` + `collections` + `collection_items`, cache hydrate, `hydratePauseMeta` on `v_pause_full` + `pause_companion_events`). Page: tabs, client filters/sort, `CurrentPauseCard`, PTR → `refetch`, infinite scroll → `loadMore`. `LibraryItems` empty state + virtuoso lists. Gap: `fetchAll` does not surface Supabase errors; `library.loading` is exposed but unused on page (cache-first OK; failed fetch may look like empty).*

### Journey (hub tabs)

- [x] `/journey` → redirect to `/journey/stats` — *L4 2026-04-30: `App.tsx` `<Navigate to="/journey/stats" replace />`.*
- [x] `/journey/stats` — *L4: `Profile` tab `stats` → skeleton until `pause_instances` count query completes → `StatsContentV2` + `useHoldGoalProfile`; no error surface on count failure.*
- [x] `/journey/insights` — *L4: `ProLock` feature `ai_insights`; skeleton then `AIInsightsPanel` with `completedPauseCount`.*
- [x] `/journey/badges` — *L4: skeleton then `BadgesPanelV2` (`subscribed`, `holdGoal`). Sibling static route `/journey/badges/guide` → `BadgeGuide` (does not collide with `:tab`).*
- [x] `/journey/activity` — *L4: `ProLock` feature `history`; `HistoryContent`.*
- [x] Invalid `/journey/:tab` → normalizes to `stats` (behavior check) — *L4: `isProfileTab` false → `useEffect` `navigate('/journey/stats', { replace: true })`; local `tab` defaults to `'stats'` until redirect.*

### Settings tree

- [x] `/settings` — hub (`SettingsHub` index) — *L5 2026-04-30: `SettingsRoot` → pathless `SettingsStateLayout` (`useSettingsModel` = `useHolzen` + `useSubscription` + push/install/changelog, etc.) → skeleton until `profileLoaded` → `SettingsStateProvider` → index `SettingsHub`. Hub: `SECTION_ROWS` links to `/settings/:section`, hash `#settings-section-*` → `replace` navigate; secondary link to `/settings/about` + unseen changelog dot via model. No hub-level fetch; errors/empty are inherited from `useHolzen` loading gate.*
- [x] `/settings/you` — *L6 2026-04-30: `SettingsSectionPage` validates `:section` → else `Navigate` to `/settings`; renders `SettingsYouPanel` under `useSettingsState`. Panel: `firstName`, `motivations`, `mantra`, `GroundingTagInput` → setters from model (`useHolzen` profile fields). `useSettingsModel` debounced “Saved” toast tracks many profile fields but **omits `motivations`** in its dependency list (toast may not fire when only motivations change; persistence still via `useHolzen`). Language row commented out in panel.*
- [x] `/settings/reflection` — *L7 2026-04-30: `SettingsReflectionPanel` — `ThresholdSetting` (local slider state + explicit **Confirm** per axis → `setThreshold` / `setThresholdDown` / `setCumulativeThreshold`), `ThresholdFrequencyEstimator`; cooldown **1/6/12/24h** grid; **ProLock** on tone, style, `custom_prompt` textarea (200 cap). All wired via `useSettingsState`; auto-save toast deps in `useSettingsModel` include threshold fields, `cooldownHours`, `reflectionTone`, `reflectionStyle`, `customPrompt`. No panel-specific fetch/error UI (profile path + toast).*
- [x] `/settings/experience` — *L8 2026-04-30: `SettingsExperiencePanel` — BTC **conviction** mode + **`localStorage`**; **currency** grid (disabled visually when BTC mode); **Zen** + LS; **checkout suppression** minutes (`commitCheckoutWindow` / min–max consts, blur + Enter); **silent mode**; **notification sound** + LS; **haptics** via `persistHapticEnabled`. `useSettingsModel` auto-save toast deps include **`silentMode`** and **`currency`** but **not** `btcMode`, `zenMode`, `soundEnabled`, `hapticEnabled`, or **`checkoutWindowMinutes`** (client-pref / separate persistence; no misleading “Saved” for those).*
- [x] `/settings/companions` — *L9 2026-04-30: `SettingsCompanionsPanel` wrapped in **`ProLock` `feature="companions"` `hideContent`** — non‑Pro users get CTA only (**children not mounted**, no `SourceManagement` fetch). Pro: companion **`Switch`**es → **`setCompanionPref`**; **`aiInsightsEnabled`** toggle; **`SourceManagement`** loads **`signal_sources`** + **`user_signal_preferences`** (parallel `supabase`, **`loading`** skeleton; initial load **ignores query errors**—empty UI risk); mutations use toast on add failure.*
- [x] `/settings/notifications` — *L10 2026-04-30: `SettingsNotificationsPanel` — **email** + **push** (`usePushNotifications` / `register-push` edge via **`supabase.functions.invoke`**): **`pushLoading`** on switch + finish-setup **`Alert`** when permission granted but not subscribed. **`InstallHolzenCard`** + **badge** toggle sit **outside** **`ProLock`**. **`ProLock` `feature="notifications"` `hideContent`** wraps digest frequency, night reflection hour, quiet hours, **`QuietWindowsManager`** (non‑Pro: block not mounted). Profile auto-save toast deps cover **`emailNotifications`**, **`digestFrequency`**, **`notifyBadges`**, **`nightReflectionHour`**, **`quietHoursStart`/`End`**. Gap: **`usePushNotifications`** subscribe/unsubscribe failures only **`console.error`**—no user-facing error toast.*
- [x] `/settings/subscription` (+ checkout / portal flows) — *L11 2026-04-30: `SettingsSubscriptionPanel` — **`subLoading`** / subscribed vs free copy; **`startCheckoutFromSettings`** → **`create-checkout`** edge (sessionStorage return key, redirect to **`data.url`**); **`openPortal`** → **`customer-portal`** edge **`window.open`**. **`use-subscription`**: checkout/portal failures **`console.error` only**; missing **`data.url`** clears loading / no toast. **`CreditsDashboard`** (own **`useSubscription`**: loading line + **`manualRetry`**). **`ReferralSection`**: profile **`referral_code`** + counts (no error surface; **`null`** if no code). Link to **`/settings/billing-history`**.*
- [x] `/settings/account` — *L12 2026-04-30: `SettingsAccountPanel` — email display; **`ChangeEmailSection`** (`supabase.auth.updateUser({ email })`, **toast** success/error). Password → **`changePassword`** (**`supabase.auth.updateUser({ password })`**, toasts; UI **`minLength={8}`** + pattern vs model **6-char** minimum — mild inconsistency). Export **`exportData`** (parallel **`supabase`** reads → download JSON/CSV, **`toast`** on failure). **`delete-account`** edge **`invoke`**, success **`signOut`**, error toast. Install / **sign-out** / **delete** **`AlertDialog`**; delete shows **`deleting`** spinner.*
- [x] `/settings/about` — *L13 2026-04-30: `SettingsAbout` — **outside** `SettingsStateLayout` (no `useSettingsState`; light page). **`useLatestChangelogVersion`**: `changelog_entries` latest version + **`localStorage`** “seen” → **`hasNewVersion`** badge; **no error branch** on query. **`FeedbackForm`**: offline **`enqueueAction('feedback')`** + toast; online **`send-feedback`** **`invoke`** with **`cid`** / **`__APP_VERSION__`**, **toast** on error. **`Changelog`** dialog: paginated **`changelog_entries`** (open-triggered fetch; **no explicit error UI**). **`AppVersionBadge`** shows version + `latestVersion`.*
- [x] `/settings/billing-history` — *L14 2026-04-30: `BillingHistory` — **outside** `SettingsStateLayout` (standalone). **`list-checkout-events`** via **`supabase.functions.invoke`** (raw, not **`invokeEdge`** — **`x-cid`** consistency note). **`load`**: initial **skeleton**; **error** panel + **Try again**; **empty** copy; **Refresh** uses silent mode → **toast** only on silent failure. Strong payment-status / grant-badge display helpers.*

### Tools index (shell)

- [x] `/tools` — `ToolsHub` — *L15 2026-04-30: Static **`TOOL_LINKS`** from **`TOOLS`** (`app-routes`); **`useProGate`** only gates **Pro** pill on **letters** + **ground** (`!isPending && !isPro`). No remote fetch; no error/empty states. **`isPending`**: badges hidden; links still shown (destination routes own gates).*
- [x] `/tools/letters` — `ToolsLetters` (deep link `?letter=` if product uses it) — *L16 2026-04-30: **`useHolzen().btcData`** — skeleton until present (no explicit **error** if BTC never loads). **`?letter=`** → **`scrollToLetterId`**; **`autoOpenComposer={!letterId}`**. **`ProLock` `hideContent`** → **`LetterToFutureSelf`** only mounts for **Pro** (free users: CTA only, no deep-link scroll). Child: **`future_letters`** `select` (**.then** without **`error`** branch — failed fetch looks like **empty** + **`loaded`**).*

---

## 2 — Tier B — Immersive: pause + companion surfaces

- [x] `/pause` — `PauseSession` (pipeline per Phase 2; add UI/state edge cases here) — *L17 2026-04-30: **Hydration** — `loadSession` → **`parsePauseSessionLocationState`** → `useHolzen` vs **`navPauseInstanceId`** fetch (`pause_instances` + `pause_ai_artifacts`; **`fetchFailed`** only if row missing). **`PauseSessionGate`**: loading / could-not-load / profile loading / **no reflection**. **`saveSession`** syncs progress. **Steps** through **`PauseReflect`** (edge pipeline in children per Phase 2). **`pauseLogStep`**, favorite **`library_items`** update, **`handleDecide`** clears session + home. **Nit:** Supabase **errors** on fetch queries do not set **`fetchFailed`** (only missing instance).*
- [x] `/companion/zoom-out/:pauseInstanceId` — `CompanionZoomOutPage` — *L18 2026-04-30: **Route** — `ProtectedRoute`, lazy page. **`useParams`** `pauseInstanceId`; missing → **`Navigate` to `/` (replace)**. **Snapshot** — **`loadPauseSessionSnapshot`** (`pause-page-loader`): `pause_instances` + `pause_ai_artifacts`; **requires** `reflection_text` message or returns **null** → **`loadError`** (`CompanionFocusLayout` + **`focusLoadError`**). Spinner until snapshot. **Data** — **`useCompanionData`** with **`prefs.zoomOut: true`**; intervention hydrate effect may fill **zoom-out from artifact cache** first; page **`useEffect`** calls **`fetchCompanion('zoomOut')`** when **`!interventionLoading`** and slot empty/idle. **Edge** — **`companion-orchestrate`** via **`supabase.functions.invoke`** (not **`invokeEdge`** / **`x-cid`**). Errors → toast + **`zoomOutError`** → **`CompanionError`** + **`retryZoomOut`**. **Empty payload** after OK response → error flag. **UI** — **`ZoomOutDisplay`** skeleton / error / **null** when no data; **`isEmpty`** copy when data has no prices+echo. **Save / feedback** — staggered **`SaveThisMomentButton`**, **`CompanionFeedback`**, **`HistoryThread`**. **Back** — `location.state.from === 'library'` → **`/library`**, else history. **Nit:** **`loadPauseSessionSnapshot`** ignores **`pause_ai_artifacts`** query **error** (treats as no reflection → null).*
- [x] `/companion/history/:pauseInstanceId` — `CompanionHistoryPage` — *L19 2026-04-30: **Same shell as zoom-out** — `ProtectedRoute`, lazy; **`useParams`**; missing → **`Navigate` to `/` (replace)**; **`loadPauseSessionSnapshot`** → spinner / **`loadError`** + **`focusLoadError`** (reflection required — same **`pause-page-loader`** nits as L18). **`useCompanionData`** with **`prefs.history: true`**; cache hydrate may fill **`historyInsight`**; **`useEffect`** → **`fetchCompanion('history')`** when **`!interventionLoading`** and slot idle. **Edge** — **`companion-orchestrate`** via **`supabase.functions.invoke`** (not **`invokeEdge`**). **`HistoricalInsightDisplay`**: skeleton → **`CompanionError`** + **`retryHistory`** → **`null`** if no data (**no** “empty state” copy vs **`ZoomOutDisplay`**). **`SaveThisMomentButton`** / **`CompanionFeedback`** (`history_insight`) / **`HistoryThread`**; **`useFullviewTelemetry('history')`**. **Back** — library **`state.from`** vs **`-1`**.*
- [x] `/companion/signal/:pauseInstanceId` — `CompanionSignalPage` — *L20 2026-04-30: **Route** — `ProtectedRoute`, lazy **`/companion/signal/:pauseInstanceId`**. Same **snapshot** gate as other companion focus pages (**`loadPauseSessionSnapshot`**, **`Navigate` `/`** if no param, spinner, **`loadError`**). **`useCompanionData`** with **`prefs.signal: true`**; **`fetchCompanion('signal')`** after **`!interventionLoading`** when slot idle; **`companion-orchestrate`** via **`supabase.functions.invoke`** (not **`invokeEdge`**). **`SignalFullView`**: skeleton while loading; then **`if (error || !signal)` → `CompanionError`** — **so `!signal` with `error` false still shows error UI** (e.g. **`canAccessCompanion`** early return: no fetch, no **`signalError`** — misleading vs paywall toast). Extra **`signal_sources`** read for **trusted host** favicon row (**errors ignored** → **`isTrusted` false**). **`ReadTime` / `WhyThisCard`** inside full view; no separate row like history/zoom. **Save / feedback / `HistoryThread`** + cache relaxation line; **`useFullviewTelemetry('signal')`**.*
- [ ] `/companion/grounding/:pauseInstanceId` — `CompanionGroundingPage`

---

## 3 — Tier C — Regulation + practice (full-screen)

- [ ] `/tools/breathe` — `Breathe`
- [ ] `/tools/ground` — `Ground` (index)
- [ ] `/tools/ground/history` — `GroundHistory`
- [ ] `/tools/practice/checkin` — `PracticeCheckIn`
- [ ] `/tools/practice/journal` — `PracticeJournal`
- [ ] `/tools/practice/bodyscan` — `PracticeBodyScan`
- [ ] `/tools/practice/replay` — `PracticeReplay`

---

## 4 — Tier D — Public, marketing, account recovery

- [ ] `/welcome` — `Landing` (`PublicOnlyRoute`)
- [ ] `/auth` — `Auth` (`PublicOnlyRoute`)
- [ ] `/reset-password` — `ResetPassword`
- [ ] `/terms` — `Terms`
- [ ] `/privacy` — `Privacy`
- [ ] `/about` — `About`
- [ ] `/blog` — `Blog`
- [ ] `/blog/:slug` — `BlogPost` (pick representative slugs)
- [ ] `/roadmap` — `RoadmapStub`
- [ ] `/reserve` — `Reserve`
- [ ] `/unsubscribe` — `Unsubscribe`

---

## 5 — Tier E — Admin (only if `VITE_ADMIN_USER_IDS` includes your test user)

- [ ] `/admin` — `Admin`
- [ ] `/admin/smoke-test` — `SmokeTest`
- [ ] `/admin/sentry-alerts` — `SentryAlerts`
- [ ] `/admin/edge-coverage` — `EdgeCoverage`

---

## 6 — Tier F — Catch-all and negatives

- [ ] Unknown path → `NotFound` (`*` route)

---

## 7 — Cross-cutting (can overlap with tiers; dedicate at least one pass each)

- [ ] **i18n** — keys, fallbacks, language switch + persistence ([docs/design/information-architecture.md](../design/information-architecture.md) alignment where relevant)
- [ ] **PWA / SW** — `src/sw.ts`, update prompts, offline ([AGENTS.md](../../AGENTS.md))
- [ ] **Push + in-app notifications** — `register-push`, bell UI, cron-driven surfaces
- [ ] **Subscription UX** — `useSubscription`, success/cancel return, portal, billing history
- [ ] **Analytics / flags** — PostHog events per [ops/event-taxonomy.md](../ops/event-taxonomy.md); flags per [ops/feature-flags.md](../ops/feature-flags.md)
- [ ] **Observability** — Sentry + `x-cid` / `invokeEdge` patterns on new or risky call sites ([AGENTS.md](../../AGENTS.md))
- [ ] **Stripe / billing edges** — aligned with settings subscription flow ([bruno/functions-catalog.md](../../bruno/functions-catalog.md) billing folder)

---

## 8 — Edge functions & HTTP entrypoints (tick when reviewed with their **calling** UI or cron doc)

Alphabetical per `supabase/config.toml` (each row: contract, auth, errors, logging).

- [ ] `admin-check-stripe-prices`
- [ ] `admin-library-preview`
- [ ] `ai-cost-alert`
- [ ] `auth-email-hook`
- [ ] `backfill-btc-prices`
- [ ] `badge-notify`
- [ ] `check-subscription`
- [ ] `check-volatility`
- [ ] `companion-orchestrate`
- [ ] `create-checkout`
- [ ] `customer-portal`
- [ ] `delete-account`
- [ ] `deliver-letters`
- [ ] `fetch-source-feeds`
- [ ] `generate-wallpaper`
- [ ] `grounding-enrich`
- [ ] `handle-email-suppression`
- [ ] `handle-email-unsubscribe`
- [ ] `health`
- [ ] `holzen-number`
- [ ] `holzen-reflect`
- [ ] `journal-prompt`
- [ ] `list-checkout-events`
- [ ] `monthly-report`
- [ ] `night-reflection`
- [ ] `notify-checkout-confirmation`
- [ ] `personalized-nudge`
- [ ] `pregenerate-companions`
- [ ] `preview-transactional-email`
- [ ] `process-email-queue`
- [ ] `process-referral-pending`
- [ ] `record-referral`
- [ ] `reflection-insights`
- [ ] `refresh-btc-prices`
- [ ] `register-push`
- [ ] `retry-flex-credit`
- [ ] `seed-btc-history`
- [ ] `send-feedback`
- [ ] `send-transactional-email`
- [ ] `stripe-webhook`
- [ ] `suggest-grounding`
- [ ] `suggest-ritual`
- [ ] `weekly-digest`

**HTTP tooling:** [fundamentals/http-review-playbooks.md](../fundamentals/http-review-playbooks.md), [bruno/SCOPE.md](../../bruno/SCOPE.md).

---

## 9 — Optional deep passes (not every route)

- [ ] **Browser 360°** — [fundamentals/browser-360-mcp-playbook.md](../fundamentals/browser-360-mcp-playbook.md) on `/` and one heavy route
- [ ] **E2E automation gap** — [backlog/e2e-browser-automation.md](../backlog/e2e-browser-automation.md) (plan tests for flows you care most about)
- [ ] **Repo size / review throughput** — [fundamentals/codebase-size-and-review-practices.md](../fundamentals/codebase-size-and-review-practices.md)

---

## 10 — After review

- [ ] File tickets / backlog entries for findings ([backlog/backlog.md](../backlog/backlog.md) or new `backlog/*.md` rows)
- [ ] Refactors: [fundamentals/refactoring-strategy.md](../fundamentals/refactoring-strategy.md) (includes **full-stack** touchpoints) + [backlog/react-page-and-hook-splitting.md](../backlog/react-page-and-hook-splitting.md) for UI extraction backlog
- [ ] If shipping: [ops/deployment-sync-guide.md](../ops/deployment-sync-guide.md)

---

## Related

| Doc | Role |
|-----|------|
| [full-app-review-backlog.md](full-app-review-backlog.md) | Hour estimates, sequencing narrative, dependencies |
| [react-spa-review-template.md](react-spa-review-template.md) | PR + audit questions per slice |
| [design/information-architecture.md](../design/information-architecture.md) | Product IA vs routes |

---

## 11 — Appendix: prompt for an agent review loop (copy-paste)

Use this (or shorten it) when you want the agent to **review one slice per loop**, optionally **fix** small issues in the same loop, **update this checklist** (`[ ]` → `[x]` for completed items), and **`git commit`** before stopping.

```text
Holzen review loop — follow the repo workflow:

1. Read `.cursor/skills/holzen-flow-review/SKILL.md` and use `docs/reviews/end-to-end-review-master-checklist.md` + `docs/reviews/react-spa-review-template.md`.

2. One loop = ONE scope from the master checklist (e.g. next unchecked item in §1 Tier A shell, OR one route, OR one edge function together with its UI caller). Trace flow-first: UI → state → Supabase / invokeEdge → state → UI. Note loading/error/empty gaps.

3. Outcomes this loop (pick what applies):
   - If only analysis: short written findings (bullets) and mark the checklist item [x] in `docs/reviews/end-to-end-review-master-checklist.md`.
   - If you fix bugs or small refactors: minimal diff, match `docs/fundamentals/refactoring-strategy.md`; do not widen scope.

4. At end of loop: `git add` relevant files and commit with a message like `review: tier A shell — notes` or `fix: <area> <what>` (one logical commit per loop).

5. Stop after the commit and tell me what you checked and what’s next unchecked.

Resume hint: start from §<N> first unchecked `[ ]` unless I specify otherwise below.

[Optional: “Focus only on …” or “Do not change code this loop, checklist + notes only.”]
```

**Tips:** Narrow scope per loop (half a day max of surface area). If a loop finds large work, **ticket it** and still commit checklist progress + backlog stub rather than a huge refactor in one commit.
