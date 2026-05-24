#!/usr/bin/env bash
# Pull a data-only snapshot from staging or prod for local debugging / dry-runs.
#
# Usage:
#   npm run db:pull:staging
#   npm run db:pull:prod
#   bash scripts/db-pull-remote.sh staging
#   bash scripts/db-pull-remote.sh prod --include-telemetry
#
# Writes to backups/pull-<env>-<timestamp>/ (gitignored).
# Does NOT restore — use npm run db:restore:local with the output directory.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=db/_common.sh
source "$ROOT/scripts/db/_common.sh"

ENV_NAME="${1:-}"
shift || true

INCLUDE_TELEMETRY=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --include-telemetry) INCLUDE_TELEMETRY=1 ;;
    *) db_die "Unknown flag: $1" ;;
  esac
  shift
done

[[ -n "$ENV_NAME" ]] || db_die "Usage: db-pull-remote.sh <staging|prod|legacy> [--include-telemetry]"

db_load_env_file "$ROOT/.env.db.local"
db_load_env_file "$ROOT/.env.db"

URL="$(db_resolve_database_url "$ENV_NAME")"
[[ -n "$URL" ]] || db_die "No DATABASE_URL for '$ENV_NAME'. Set in .env.db.local (see .env.db.example)."

SKIP_TELEMETRY=1
if [[ "$INCLUDE_TELEMETRY" == "1" ]]; then
  SKIP_TELEMETRY=0
fi

db_require_cmds

OUT_DIR="$(db_backups_dir "pull-${ENV_NAME}")"
AUTH_SQL="$OUT_DIR/01-auth.sql"
PUBLIC_SQL="$OUT_DIR/02-public.sql"
CATALOG_SQL="$OUT_DIR/03-companion-catalog.sql"
META="$OUT_DIR/README.txt"

printf "Pull remote snapshot (%s)\n" "$ENV_NAME"
printf "  URL: %s\n" "$(db_mask_url "$URL")"
printf "  OUT: %s\n" "$OUT_DIR"

db_dump_auth "$URL" "$AUTH_SQL"
db_dump_public "$URL" "$PUBLIC_SQL" "$SKIP_TELEMETRY"
if [[ "$ENV_NAME" == "legacy" || "$ENV_NAME" == "lovable" || "$ENV_NAME" == "old" ]]; then
  db_dump_content_library_as_catalog "$URL" "$CATALOG_SQL"
fi

cat >"$META" <<EOF
Holzen remote DB pull
  env: ${ENV_NAME}
  at:  $(date -u +%Y-%m-%dT%H:%M:%SZ)
  telemetry included: $([[ "$SKIP_TELEMETRY" == "0" ]] && echo yes || echo no)

Restore locally:
  npm run db:restore:local -- ${OUT_DIR}

Never commit this directory — contains PII.
EOF

printf "\n✓ Snapshot saved to %s\n" "$OUT_DIR"
