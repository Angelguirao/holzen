---
name: react-doctor
description: Use when finishing a feature, fixing a bug, before committing React code, or when the user types `/doctor`, asks to scan, triage, or clean up React diagnostics. Covers lint, accessibility, bundle size, architecture. Includes a regression check and a full local-triage workflow that fetches the canonical playbook.
version: "1.1.0"
---

# React Doctor

Scans React codebases for security, performance, correctness, and architecture issues. Outputs a 0–100 health score.

Holzen: run via **`npm run doctor`** (pinned `react-doctor` devDependency).

## After making React code changes

```bash
npm run doctor -- --verbose --diff
```

Check the score did not regress. If it dropped, fix regressions before committing.

## For general cleanup or code improvement

```bash
npm run doctor -- --verbose
```

Fix issues by severity — errors first, then warnings. Treat findings as hypotheses; read the file before changing. Ignore bulk style rules and `src/legacy/**` unless the task explicitly includes legacy. See [active-surface.md](../../../docs/ops/active-surface.md) and root `react-doctor.config.json` (legacy paths, design tag, dead-code false positives, compiler pilot rules).

## /doctor — full local triage workflow

When the user types `/doctor`, says "run react doctor", or asks for a full triage / cleanup pass (not just a regression check), fetch the canonical local-triage playbook and follow every step in it:

```bash
curl --fail --silent --show-error \
  --header 'Cache-Control: no-cache' \
  https://www.react.doctor/prompts/react-doctor-agent.md
```

Pair with per-rule prompts at `https://www.react.doctor/prompts/rules/<plugin>/<rule>.md` when fixing a specific rule family.

## Command reference

| Flag | Purpose |
|------|---------|
| `--verbose` | Show affected files and line numbers per rule |
| `--diff` | Only scan changed files vs base branch |
| `--score` | Output only the numeric score |
