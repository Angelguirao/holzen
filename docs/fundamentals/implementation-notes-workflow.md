# Implementation notes workflow

**Status:** accepted (May 2026)  
**Audience:** humans and agents implementing non-trivial specs (architecture migrations, feature slices, cross-cutting refactors)  
**Pairs with:** [documentation-strategy.md](documentation-strategy.md), [pause-client-architecture.md](../systems/pause-client-architecture.md), [.cursor/rules/architecture-migration.mdc](../../.cursor/rules/architecture-migration.mdc)

When implementing a **spec** (architecture target doc, ADR, or scoped ticket), maintain a **running implementation notes** file alongside the work. It is the audit trail for **interpretation**, not a second spec.

---

## 1. When to use it

| Use implementation notes | Skip |
|--------------------------|------|
| Multi-commit migration (`cursor/arch-migrate-src-ca70`) | One-line typo fix |
| Spec says “target” but tree is transitional | Pure doc typo |
| Ambiguity requires a choice reviewers should see | Behavior unchanged rename |
| Intentional deviation from spec | |

**One notes file per initiative** (branch or epic), not per commit. Append as you work; do not rewrite history unless correcting errors.

---

## 2. Where files live

```text
docs/artifacts/<initiative-slug>/
  implementation-notes.html    # human-readable running log (canonical for agents)
  README.md                    # one line: what initiative, link to spec
```

| Initiative | Path | Spec (owner) |
|------------|------|--------------|
| Client architecture migration | [docs/artifacts/architecture-migration/](../artifacts/architecture-migration/) | [pause-client-architecture.md](../systems/pause-client-architecture.md) (reference impl + §9 template) + [holzen-application-architecture.md](holzen-application-architecture.md) (full `src/` north star) |

Commit the notes file **in the same PR** as the code when you add a decision, deviation, tradeoff, or open question. Empty sections are fine until something worth recording appears.

---

## 3. Required sections (each entry)

Every note is one `<article class="note">` with:

| Section | Content |
|---------|---------|
| **Design decisions** | Spec was ambiguous; what you chose and why |
| **Deviations** | Intentional departure from spec (with spec section ref) |
| **Tradeoffs** | Alternatives considered; why the picked option |
| **Open questions** | Needs product/architect confirmation before changing spec |

Also record: **date**, **commit or slice title**, **spec section** (link or §), **status** (`open` | `resolved` | `wont-fix`).

When a question is resolved, add a **Resolution** paragraph under the same note — do not delete the original.

---

## 4. Agent workflow (“Implement &lt;SPEC&gt;”)

1. **Read spec** — owner doc from [docs/README.md](../README.md) canonical table or AGENTS change map.
2. **Open or create** `docs/artifacts/<initiative>/implementation-notes.html`.
3. **Before each slice:** skim spec + notes for open questions that block the slice.
4. **After each slice** (same commit or immediate follow-up commit): append notes if any of the four categories applied; otherwise no entry needed.
5. **If deviation is permanent:** update the **owner spec** in a follow-up commit when agreed — notes are the staging area, not a substitute for fixing drift in canonical docs.

Prompt pattern for Cursor / Cloud Agent:

```text
Implement <SPEC>. Maintain docs/artifacts/<initiative>/implementation-notes.html
with design decisions, deviations, tradeoffs, and open questions as you work.
Follow architecture-migration.mdc and the spec owner doc.
```

---

## 5. Keeping architecture aligned (enforcement ladder)

Architecture is enforced in **layers** — notes complement automation; they do not replace it.

| Layer | Mechanism | Catches |
|-------|-----------|---------|
| **1. Spec** | Owner docs (`pause-client-architecture.md`, `pause-system.md`, `active-surface.md`) | Wrong mental model |
| **2. Agent rules** | `.cursor/rules/architecture-migration.mdc`, `change-context.mdc` | Session drift before edit |
| **3. Implementation notes** | `implementation-notes.html` | Ambiguity, intentional deviation, unresolved questions |
| **4. CI / scripts** | `check:feature-imports`, `check:architecture-alignment`, `check:active-surface`, `check:no-root-components` | Deep imports, legacy, wrong layers |
| **5. Pre-push** | `npm run check:prepush` (when available) | Full gate before merge |
| **6. PR review** | [client-src-layout.md](client-src-layout.md) checklist + [react-spa-review-template.md](../reviews/react-spa-review-template.md) | Flow, authority, shipped surface |
| **7. Spec sync** | Same PR updates owner doc when behavior or **target** structure changes | Doc/code drift |

**Habit:** if CI passes but you made a **design choice** the spec did not mention, log it in implementation notes. If the choice **changes the target**, update the spec in that PR or file an open question.

---

## 6. Relationship to other docs

| Doc kind | Role |
|----------|------|
| **Owner spec** (e.g. `pause-client-architecture.md`) | Normative **target** — update when target changes |
| **Implementation notes** | **Running delta** — how this branch interpreted the target today |
| **ADRs** (`docs/decisions/`) | Irreversible or costly choices — promote from notes when decided |
| **Backlog** (`docs/backlog/`) | Future work — not normative for current behavior |

Do not duplicate long spec prose inside HTML notes — link to the spec section instead.

---

## 7. Related

- [pause-client-architecture.md](../systems/pause-client-architecture.md) — current migration spec
- [refactoring-strategy.md](refactoring-strategy.md) — slice discipline
- [naming-conventions-holzen.md](naming-conventions-holzen.md) — naming during migration
