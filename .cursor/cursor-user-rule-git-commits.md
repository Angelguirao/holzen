# Cursor User Rule — replace `committing-changes-with-git`

Paste this into **Cursor Settings → Rules → User rules** (replace the old block that says "Only create commits when requested by the user").

This removes the conflict with Holzen's project rule [`.cursor/rules/git-commits.mdc`](rules/git-commits.mdc).

---

## committing-changes-with-git

**Holzen repo (`holzen`):** Follow project rule `.cursor/rules/git-commits.mdc` — commit after each logical slice and at task end; do not wait to be asked unless the user said WIP / no commit.

**All other repos:** Only create commits when the user explicitly asks. If unclear, ask first.

When the user asks you to create a commit, follow the git safety protocol: parallel `git status`, `git diff`, `git log`; draft message from staged changes; stage and commit; `git status` after. Never commit secrets; never `--no-verify` or force-push unless asked; never amend failed hook commits.

Do not push unless the user explicitly asks.
