#!/usr/bin/env bash
# scripts/pre-push-check.sh
#
# Pre-push checklist for Holzen.
#
# Run this BEFORE `git push` to catch the things Lovable's GitHub sync
# can't catch for you:
#   1. Migrations that fail on a fresh `supabase db reset`
#      (the silent-failure mode that desyncs repo from live DB).
#   2. View migrations using the unsafe `CREATE OR REPLACE VIEW`
#      column-rename pattern.
#   3. Edge functions registered in supabase/config.toml.
#   4. Edge function Deno typecheck.
#   5. Frontend build + tests.
#
# Usage:
#   npm run check:prepush
#
# Requirements (skipped gracefully if absent):
#   - supabase CLI                (for db reset)
#   - docker / supabase start     (for local stack)
#   - deno                        (for check:edge)
#
# Exit codes:
#   0  all checks passed (or skipped because optional tooling missing)
#   1  at least one REQUIRED check failed
set -uo pipefail

# ---- pretty output -----------------------------------------------------------
RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BLUE=$'\033[34m'; BOLD=$'\033[1m'; RESET=$'\033[0m'

step()  { printf "\n${BOLD}${BLUE}▶ %s${RESET}\n" "$*"; }
ok()    { printf "  ${GREEN}✓${RESET} %s\n" "$*"; }
warn()  { printf "  ${YELLOW}⚠${RESET} %s\n" "$*"; }
fail()  { printf "  ${RED}✗${RESET} %s\n" "$*"; }
skip()  { printf "  ${YELLOW}↷ skipped:${RESET} %s\n" "$*"; }

FAILED=0
WARNED=0
fail_check() { FAILED=$((FAILED+1)); fail "$*"; }
warn_check() { WARNED=$((WARNED+1)); warn "$*"; }

# ---- repo root ---------------------------------------------------------------
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "${BOLD}Holzen pre-push checklist${RESET}"
echo "Repo: $ROOT"

# ---- 0. Edge release stamp ---------------------------------------------------
# Refresh `supabase/functions/_shared/release.ts` so edge-deployed Sentry events
# (and BetterStack log lines) report a real Git SHA instead of "unknown". The
# script is idempotent: no write, no warning if the stamp is already current.
step "0/5  Edge release stamp"

if node scripts/stamp-edge-release.mjs; then
  if ! git diff --quiet -- supabase/functions/_shared/release.ts 2>/dev/null; then
    warn_check "release.ts was regenerated — run: git add supabase/functions/_shared/release.ts && git commit --amend --no-edit"
  else
    ok "edge release stamp up to date"
  fi
else
  warn_check "stamp-edge-release.mjs failed — edges may report 'unknown' release"
fi

# ---- 1. View safety lint -----------------------------------------------------
step "1/5  View safety lint (CREATE OR REPLACE VIEW)"

# Delegate to the dedicated Node linter. It parses each migration's column list
# and only fails when a CREATE OR REPLACE VIEW would actually break Postgres
# (non-append-only change without a prior DROP VIEW). Exit code 1 = fail CI.
if node scripts/lint-view-migrations.mjs; then
  ok "all CREATE OR REPLACE VIEW migrations are safe"
else
  fail_check "unsafe view migration(s) detected — fix before pushing (see output above)"
fi

# ---- 2. config.toml coverage -------------------------------------------------
step "2/5  Edge functions registered in supabase/config.toml"

if [ ! -f supabase/config.toml ]; then
  warn_check "supabase/config.toml not found"
else
  missing=0
  while IFS= read -r dir; do
    name="$(basename "$dir")"
    [ "$name" = "_shared" ] && continue
    [ -f "$dir/index.ts" ] || continue
    if ! grep -qE "^[[:space:]]*\[functions\.${name}\]" supabase/config.toml; then
      fail_check "function '${name}' has no [functions.${name}] block in supabase/config.toml"
      missing=$((missing+1))
    fi
  done < <(find supabase/functions -mindepth 1 -maxdepth 1 -type d 2>/dev/null)
  if [ "$missing" -eq 0 ]; then ok "all functions registered"; fi
fi

# ---- 3. Edge function typecheck ---------------------------------------------
step "3/5  Edge function typecheck (npm run check:edge)"

if npm run | grep -qE "^\s+check:edge"; then
  if npm run check:edge --silent 2>&1 | tee /tmp/.check-edge.log | tail -20; then
    ok "deno check passed (or skipped because Deno missing)"
  else
    fail_check "npm run check:edge failed (see /tmp/.check-edge.log)"
  fi
else
  skip "npm run check:edge is not defined"
fi

# ---- 3b. Edge function logging guardrail ------------------------------------
# Catches functions that boot Deno.serve / serve(...) without wrapping the
# handler in withRequestLogging — those would silently disappear from
# BetterStack and Sentry. Cheap regex check, runs in <100 ms.
if npm run | grep -qE "^\s+check:edge-logging"; then
  if npm run check:edge-logging --silent 2>&1 | tee /tmp/.check-edge-logging.log | tail -20; then
    ok "edge-logging guardrail passed"
  else
    fail_check "npm run check:edge-logging failed (see /tmp/.check-edge-logging.log)"
  fi
fi

# ---- 4. Frontend build + tests ----------------------------------------------
step "4/5  Frontend tests + build"

if npm run test --silent -- --run 2>&1 | tail -30; then
  ok "vitest passed"
else
  fail_check "npm run test failed"
fi

if npm run build --silent 2>&1 | tail -20; then
  ok "vite build passed"
else
  fail_check "npm run build failed"
fi

# ---- 5. Local supabase db reset ---------------------------------------------
step "5/5  supabase db reset (local stack)"

if ! command -v supabase >/dev/null 2>&1; then
  skip "supabase CLI not installed — install from https://supabase.com/docs/guides/local-development"
elif ! command -v docker >/dev/null 2>&1; then
  skip "docker not installed — required for local supabase stack"
else
  # Make sure we're operating on the LOCAL stack, never linked.
  status_out="$(supabase status 2>&1 || true)"
  if echo "$status_out" | grep -qiE "not running|no.*containers"; then
    warn "local supabase stack is down — starting it (this may take a minute)…"
    if ! supabase start >/tmp/.supabase-start.log 2>&1; then
      fail_check "supabase start failed (see /tmp/.supabase-start.log)"
      supabase=down
    fi
  fi

  if [ "${supabase:-}" != "down" ]; then
    echo "  Running: supabase db reset --local"
    if supabase db reset --local 2>&1 | tail -30; then
      ok "all migrations replayed cleanly on a fresh local DB"
    else
      fail_check "supabase db reset --local failed — a migration would break a fresh deploy"
      fail      "  → fix the failing migration BEFORE pushing."
    fi
  fi
fi

# ---- summary ----------------------------------------------------------------
printf "\n${BOLD}── Summary ──${RESET}\n"
printf "  failures: %s\n" "$FAILED"
printf "  warnings: %s\n" "$WARNED"

if [ "$FAILED" -gt 0 ]; then
  printf "\n${RED}${BOLD}✗ Pre-push checks FAILED. Do not push.${RESET}\n"
  exit 1
fi

if [ "$WARNED" -gt 0 ]; then
  printf "\n${YELLOW}${BOLD}⚠ Pre-push checks passed with warnings.${RESET}\n"
  printf "  Review the warnings above before pushing.\n"
  exit 0
fi

printf "\n${GREEN}${BOLD}✓ Pre-push checks all clear. Safe to push.${RESET}\n"
exit 0
