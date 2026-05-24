#!/usr/bin/env bash
# One-time data cutover: legacy Lovable Supabase → owned holzen-prod.
#
# Prerequisites:
#   1. Schema already on target: npx supabase link --project-ref geqkxsnyqvhtascjghuu && supabase db push
#   2. Vault + pg_cron bootstrapped (bootstrap-owned-project.sql, cron-setup.md)
#   3. Maintenance window — stop writes on old prod
#
# Connection strings: session pooler URI on port 5432 (not transaction pooler 6543).
# Copy .env.db.example → .env.db.local and fill passwords (never commit).
#
# Usage (Git Bash / WSL / macOS / Linux):
#   npm run db:migrate-prod
#   CONFIRM=1 npm run db:migrate-prod
#
# Env:
#   OLD_DATABASE_URL   — legacy Lovable project (default ref edgbwdecaoottowliimu)
#   NEW_DATABASE_URL   — owned holzen-prod (default ref geqkxsnyqvhtascjghuu)
#   INCLUDE_TELEMETRY=1 — also migrate analytics_events / generation_attempts / companion_serves
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=db/_common.sh
source "$ROOT/scripts/db/_common.sh"

db_load_env_file "$ROOT/.env.db.local"
db_load_env_file "$ROOT/.env.db"

OLD_URL="${OLD_DATABASE_URL:-${LEGACY_DATABASE_URL:-${LOVABLE_DATABASE_URL:-}}}"
NEW_URL="${NEW_DATABASE_URL:-${PROD_DATABASE_URL:-}}"

[[ -n "$OLD_URL" ]] || db_die "Set OLD_DATABASE_URL (legacy Lovable DB, ref ${HOLZEN_LEGACY_LOVABLE_REF})."
[[ -n "$NEW_URL" ]] || db_die "Set NEW_DATABASE_URL (owned prod, ref ${HOLZEN_PROD_REF})."

SKIP_TELEMETRY=1
if [[ "${INCLUDE_TELEMETRY:-}" == "1" || "${INCLUDE_TELEMETRY:-}" == "yes" ]]; then
  SKIP_TELEMETRY=0
fi

db_require_cmds

printf "Holzen prod data migration\n"
printf "  FROM: %s\n" "$(db_mask_url "$OLD_URL")"
printf "  TO:   %s\n" "$(db_mask_url "$NEW_URL")"
if [[ "$SKIP_TELEMETRY" == "1" ]]; then
  db_warn "Skipping telemetry tables (analytics_events, generation_attempts, companion_serves, user_companion_serves)"
fi

db_confirm_or_exit "This WRITES to the target database. Ensure schema is applied (supabase db push) and old prod is in maintenance mode."

OUT_DIR="$(db_backups_dir migrate-prod)"
AUTH_SQL="$OUT_DIR/01-auth.sql"
PUBLIC_SQL="$OUT_DIR/02-public.sql"
CATALOG_SQL="$OUT_DIR/03-companion-catalog.sql"

db_dump_auth "$OLD_URL" "$AUTH_SQL"
db_dump_public "$OLD_URL" "$PUBLIC_SQL" "$SKIP_TELEMETRY"
db_dump_content_library_as_catalog "$OLD_URL" "$CATALOG_SQL"

db_confirm_or_exit "About to restore into NEW prod. Double-check target URL above."

db_restore_sql "$NEW_URL" "$AUTH_SQL"
db_restore_sql "$NEW_URL" "$PUBLIC_SQL"
if [[ -f "$CATALOG_SQL" ]]; then
  db_restore_sql "$NEW_URL" "$CATALOG_SQL"
fi

printf "\n✓ Data migration complete. Artifacts: %s\n\n" "$OUT_DIR"
cat <<EOF
Post-restore checklist:
  1. Row counts: auth.users, profiles, pause_instances on prod
  2. Re-apply vault secrets + pg_cron (not in pg_dump) — cron-setup.md
  3. Copy Storage buckets if you use uploads (pg_dump does not include files)
  4. Update Vercel VITE_SUPABASE_* → redeploy
  5. Stripe webhook + Google OAuth redirect URLs → ${HOLZEN_PROD_REF}
  6. Smoke: sign-in, pause flow, subscription portal

Full playbook: docs/ops/database-data-migration.md
EOF
