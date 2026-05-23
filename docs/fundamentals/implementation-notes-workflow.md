# Implementation notes workflow

**Status:** accepted (May 2026)  
**Audience:** humans and agents implementing non-trivial client work (architecture migrations, feature epics, platform exit, cross-cutting refactors)  
**Pairs with:** [documentation-strategy.md](documentation-strategy.md), [client-implementation/README.md](../artifacts/client-implementation/README.md)

When implementing a **spec** (owner doc, ADR, or scoped ticket), maintain the **shared** implementation notes file alongside the work. It is the audit trail for **interpretation**, not a second spec and not a commit journal.

**Canonical log:** [docs/artifacts/client-implementation/implementation-notes.html](../artifacts/client-implementation/implementation-notes.html)

---

## 1. When to use it

| Use implementation notes | Skip |
|--------------------------|------|
| Multi-commit epic (migration, platform exit, large feature) | One-line typo fix |
| Spec says “target” but tree is transitional | Pure doc typo |
| Ambiguity requires a choice reviewers should see | Behavior unchanged rename |
| Intentional deviation from spec | Routine implementation of an already-recorded decision |
| Cross-cutting pattern choice (auth actions, hook placement, analytics boundary) | Test-only CI parity pins, merge-conflict cleanup |

**One shared log** for active client work; **tag each note with an initiative** (`architecture-migration`, `platform-exit`, `general`, or a new slug). Append as you work; do not rewrite history unless correcting errors.

**Do not log:** one note per commit. One `<article class="note">` per **interpretation** worth a reviewer seeing.

---

## 2. Where files live

```text
docs/artifacts/client-implementation/
  implementation-notes.html    # canonical shared log (all initiatives)
  README.md                    # index + initiative links

docs/artifacts/<initiative-slug>/
  README.md                    # optional: backlog, phases, link to log anchor
  implementation-notes.html    # optional redirect only — prefer shared log
```

| Initiative | Backlog README | Log section | Owner spec |
|------------|----------------|-------------|------------|
| Architecture migration | [architecture-migration/](../artifacts/architecture-migration/) | `#initiative-architecture-migration` | [holzen-application-architecture.md](holzen-application-architecture.md), [pause-client-architecture.md](../systems/pause-client-architecture.md) |
| Platform exit | [lovable-staging-and-platform-exit.md](../ops/lovable-staging-and-platform-exit.md) | `#initiative-platform-exit` | Same |
| Other / feature epic | Ticket or owner doc | `#initiative-general` or new `h3` section | [docs/README.md](../README.md) canonical table |

When a new multi-slice epic starts: add a row to **Active initiatives** in the HTML, add an `<h3 id="initiative-…">` section, and optionally create `docs/artifacts/<slug>/README.md` for backlog only.

Commit note updates **in the same PR** as the code when you add a decision, deviation, tradeoff, or open question.

---

## 3. Required sections (each entry)

Every note is one `<article class="note">` with:

| Section | Content |
|---------|---------|
| **Initiative tag** | `<span class="initiative-tag">…</span>` in header |
| **Design decisions** | Spec was ambiguous; what you chose and why |
| **Deviations** | Intentional departure from spec (with spec section ref) |
| **Tradeoffs** | Alternatives considered; why the picked option |
| **Open questions** | Needs product/architect confirmation before changing spec |

Also record: **date**, **slice title**, **spec / ticket ref**, **status** (`open` | `resolved` | `wont-fix`).

When a question is resolved, add a **Resolution** paragraph under the same note — do not delete the original.

---

## 4. Agent workflow (“Implement &lt;SPEC&gt;”)

1. **Read spec** — owner doc from [docs/README.md](../README.md) canonical table or AGENTS change map.
2. **Open** [client-implementation/implementation-notes.html](../artifacts/client-implementation/implementation-notes.html) — Ongoing open questions.
3. **Before each slice:** skim spec + notes for blockers.
4. **After each slice** (when warranted): append a tagged note under the right initiative section; update Contents index if new anchor id.
5. **If deviation is permanent:** update the **owner spec** in a follow-up commit when agreed — notes are the staging area.

Prompt pattern:

```text
Implement <SPEC>. When specs are ambiguous, append to
docs/artifacts/client-implementation/implementation-notes.html
(tag initiative, record decisions/deviations/tradeoffs/open questions).
Follow task-entry-workflow and the spec owner doc.
```

---

## 5. Enforcement ladder (client work)

Notes complement automation; they do not replace it.

| Layer | Mechanism | Catches |
|-------|-----------|---------|
| **1. Spec** | Owner docs (`pause-client-architecture.md`, system docs, `active-surface.md`) | Wrong mental model |
| **2. Agent rules** | `task-entry-workflow.mdc`, `change-context.mdc`, context-specific rules | Session drift before edit |
| **3. Implementation notes** | Shared `implementation-notes.html` | Ambiguity, deviation, unresolved questions |
| **4. CI / scripts** | `check:feature-imports`, `check:architecture-alignment`, etc. | Deep imports, legacy, wrong layers |
| **5. Pre-push** | `npm run check:prepush` (when available) | Full gate before merge |
| **6. PR review** | [client-src-layout.md](client-src-layout.md), [react-spa-review-template.md](../reviews/react-spa-review-template.md) | Flow, authority, shipped surface |
| **7. Spec sync** | Same PR updates owner doc when target changes | Doc/code drift |

**Habit:** if CI passes but you made a **design choice** the spec did not mention, log it. If the choice **changes the target**, update the spec or file an open question.

---

## 6. Relationship to other docs

| Doc kind | Role |
|----------|------|
| **Owner spec** | Normative **target** — update when target changes |
| **Implementation notes** | **Running delta** — how we interpreted the target today |
| **Initiative README** | Backlog, phases, links — not decision log |
| **ADRs** (`docs/decisions/`) | Irreversible or costly choices — promote from notes when decided |
| **Backlog** (`docs/backlog/`) | Future work — not normative for current behavior |
| **Git / PR** | What changed, when — not why when spec was silent |

Do not duplicate long spec prose inside HTML notes — link to the spec section instead.

---

## 7. Related

- [client-implementation/implementation-notes.html](../artifacts/client-implementation/implementation-notes.html) — live log
- [architecture-migration/README.md](../artifacts/architecture-migration/README.md) — migration backlog
- [refactoring-strategy.md](refactoring-strategy.md) — slice discipline
- [naming-conventions-holzen.md](naming-conventions-holzen.md) — naming during migration
