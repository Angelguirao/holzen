#!/usr/bin/env bash
# Shared helpers for Holzen database dump/restore scripts.
# Requires: pg_dump, psql (PostgreSQL client tools), bash 4+.

set -euo pipefail

# Legacy Lovable-managed prod (see supabase/migrations/* edgbwdecaoottowliimu).
export HOLZEN_LEGACY_LOVABLE_REF="${HOLZEN_LEGACY_LOVABLE_REF:-edgbwdecaoottowliimu}"
export HOLZEN_STAGING_REF="${HOLZEN_STAGING_REF:-ksplyxxdvandkwzundql}"
export HOLZEN_PROD_REF="${HOLZEN_PROD_REF:-geqkxsnyqvhtascjghuu}"

# Tier B tables dropped in 20260521200000_holzen_mvp_launch_cutover.sql — do not restore.
TIER_B_TABLES=(
  user_badges
  badge_definitions
  practice_entries
  reflection_insights
  future_letters
  night_reflections
  graph_edges
  ritual_completions
  ritual_templates
)

TELEMETRY_TABLES=(
  analytics_events
  generation_attempts
  companion_serves
  user_companion_serves
)

db_step() { printf "\n▶ %s\n" "$*"; }
db_ok()   { printf "  ✓ %s\n" "$*"; }
db_warn() { printf "  ⚠ %s\n" "$*"; }
db_die()  { printf "  ✗ %s\n" "$*" >&2; exit 1; }

db_require_cmds() {
  local cmd
  for cmd in pg_dump psql; do
    command -v "$cmd" >/dev/null 2>&1 || db_die "Missing '$cmd'. Install PostgreSQL client tools (psql/pg_dump)."
  done
}

db_load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  # shellcheck disable=SC1090
  set -a
  # shellcheck source=/dev/null
  source "$file"
  set +a
}

db_resolve_database_url() {
  local env_name="${1:-}"
  case "$env_name" in
    legacy|lovable|old)
      printf '%s' "${OLD_DATABASE_URL:-${LEGACY_DATABASE_URL:-${LOVABLE_DATABASE_URL:-}}}"
      ;;
    staging)
      printf '%s' "${STAGING_DATABASE_URL:-}"
      ;;
    prod|production)
      printf '%s' "${PROD_DATABASE_URL:-${NEW_DATABASE_URL:-}}"
      ;;
    new)
      printf '%s' "${NEW_DATABASE_URL:-}"
      ;;
    local)
      printf '%s' "${LOCAL_DATABASE_URL:-}"
      ;;
    *)
      db_die "Unknown env '$env_name'. Use legacy|staging|prod|new|local."
      ;;
  esac
}

db_build_public_exclude_args() {
  local skip_telemetry="${1:-1}"
  local args=(--exclude-table=public.schema_migrations)

  local t
  for t in "${TIER_B_TABLES[@]}"; do
    args+=(--exclude-table="public.${t}")
  done

  if [[ "$skip_telemetry" == "1" ]]; then
    for t in "${TELEMETRY_TABLES[@]}"; do
      args+=(--exclude-table="public.${t}")
    done
  fi

  printf '%s\n' "${args[@]}"
}

db_dump_auth() {
  local url="$1"
  local out="$2"
  db_step "Dump auth.users + auth.identities → $(basename "$out")"
  pg_dump \
    --data-only \
    --no-owner \
    --no-privileges \
    --schema=auth \
    --table=auth.users \
    --table=auth.identities \
    "$url" \
    >"$out"
  db_ok "auth dump ($(wc -l <"$out" | tr -d ' ') lines)"
}

db_dump_public() {
  local url="$1"
  local out="$2"
  local skip_telemetry="${3:-1}"
  local -a exclude_args=()
  local arg

  while IFS= read -r arg; do
    [[ -n "$arg" ]] && exclude_args+=("$arg")
  done < <(db_build_public_exclude_args "$skip_telemetry")

  db_step "Dump public schema (data-only) → $(basename "$out")"
  pg_dump \
    --data-only \
    --no-owner \
    --no-privileges \
    --schema=public \
    "${exclude_args[@]}" \
    "$url" \
    >"$out"
  db_ok "public dump ($(wc -l <"$out" | tr -d ' ') lines)"
}

# Old prod used content_library; owned schema uses companion_catalog.
db_dump_content_library_as_catalog() {
  local url="$1"
  local out="$2"
  db_step "Dump legacy content_library → companion_catalog remap"
  if ! pg_dump \
    --data-only \
    --no-owner \
    --no-privileges \
    --table=public.content_library \
    "$url" 2>/dev/null | sed \
      -e 's/public\.content_library/public.companion_catalog/g' \
      -e 's/ content_library / companion_catalog /g' \
      >"$out"; then
    : >"$out"
  fi
  if [[ ! -s "$out" ]]; then
    db_warn "No content_library rows (or table missing) — skipping catalog remap"
    rm -f "$out"
    return 0
  fi
  db_ok "companion_catalog remap dump"
}

db_restore_sql() {
  local url="$1"
  local file="$2"
  [[ -f "$file" ]] || db_die "Missing SQL file: $file"
  db_step "Restore $(basename "$file")"
  psql "$url" -v ON_ERROR_STOP=1 -f "$file"
  db_ok "restored $(basename "$file")"
}

db_local_database_url() {
  if [[ -n "${LOCAL_DATABASE_URL:-}" ]]; then
    printf '%s' "$LOCAL_DATABASE_URL"
    return 0
  fi
  if command -v supabase >/dev/null 2>&1; then
    local status_out
    status_out="$(supabase status 2>/dev/null || true)"
    local url
    url="$(printf '%s\n' "$status_out" | sed -n 's/^ *DB URL: //p' | head -n1)"
    if [[ -n "$url" ]]; then
      printf '%s' "$url"
      return 0
    fi
  fi
  db_die "Could not resolve local DB URL. Start Docker stack (npm run supabase:start) or set LOCAL_DATABASE_URL."
}

db_confirm_or_exit() {
  local message="$1"
  if [[ "${CONFIRM:-}" == "1" || "${CONFIRM:-}" == "yes" ]]; then
    return 0
  fi
  printf "\n%s\n" "$message"
  printf "Set CONFIRM=1 to skip this prompt.\n"
  read -r -p "Type 'yes' to continue: " answer
  [[ "$answer" == "yes" ]] || db_die "Aborted."
}

db_backups_dir() {
  local label="${1:-dump}"
  local dir
  dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/backups/${label}-$(date -u +%Y%m%dT%H%M%SZ)"
  mkdir -p "$dir"
  printf '%s' "$dir"
}

db_mask_url() {
  sed -E 's#(postgresql://[^:]+:)[^@]+#\1***#' <<<"$1"
}
