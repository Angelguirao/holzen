#!/usr/bin/env bash
# Restore a db-pull-remote (or migrate-prod) artifact directory into local Docker Supabase.
#
# Usage:
#   npm run supabase:reset          # schema from migrations first
#   npm run db:restore:local -- backups/pull-staging-20260524T120000Z
#
# Env:
#   LOCAL_DATABASE_URL — optional override (default: supabase status DB URL)
#   CONFIRM=1 — skip interactive prompt
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=db/_common.sh
source "$ROOT/scripts/db/_common.sh"

INPUT="${1:-}"
[[ -n "$INPUT" ]] || db_die "Usage: db-restore-local.sh <backup-directory>"

[[ -d "$INPUT" ]] || db_die "Not a directory: $INPUT"

AUTH_SQL="$INPUT/01-auth.sql"
PUBLIC_SQL="$INPUT/02-public.sql"
CATALOG_SQL="$INPUT/03-companion-catalog.sql"

[[ -f "$AUTH_SQL" && -f "$PUBLIC_SQL" ]] || db_die "Expected 01-auth.sql and 02-public.sql in $INPUT"

db_require_cmds

LOCAL_URL="$(db_local_database_url)"

printf "Restore into local Supabase\n"
printf "  FROM: %s\n" "$INPUT"
printf "  TO:   %s\n" "$(db_mask_url "$LOCAL_URL")"

db_warn "Run 'npm run supabase:reset' first so local schema matches migrations."
db_confirm_or_exit "This overwrites local auth + public data."

db_restore_sql "$LOCAL_URL" "$AUTH_SQL"
db_restore_sql "$LOCAL_URL" "$PUBLIC_SQL"
if [[ -f "$CATALOG_SQL" ]]; then
  db_restore_sql "$LOCAL_URL" "$CATALOG_SQL"
fi

printf "\n✓ Local restore complete. Use npm run dev:local against this stack.\n"
