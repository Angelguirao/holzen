#!/usr/bin/env node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { firstEnvValue, readDotenvFile } from "./parse-dotenv.mjs";
import { runLocalSupabaseSqlFile } from "./supabase-local-db-query.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localSupabaseDir = join(root, "supabase");
const localProjectUrl = "http://api.supabase.internal:8000";
const rescheduleSqlPath = join(root, "scripts", "sql", "reschedule-local-active-crons.sql");
const disableSqlPath = join(root, "scripts", "sql", "disable-local-active-crons.sql");
const inspectSqlPath = join(root, "scripts", "sql", "inspect-local-active-crons.sql");

function runSupabaseQuery(label, filePath) {
  runLocalSupabaseSqlFile(label, filePath);
}

function inspectLocalCronJobs(label) {
  runSupabaseQuery(label, inspectSqlPath);
}

function sqlLiteral(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

function writeTempSql(contents) {
  const tempDir = mkdtempSync(join(tmpdir(), "holzen-local-crons-"));
  const tempPath = join(tempDir, "local-crons.sql");
  writeFileSync(tempPath, contents, "utf8");
  return { tempDir, tempPath };
}

const envMaps = [
  readDotenvFile(join(localSupabaseDir, ".env.local")),
  readDotenvFile(join(localSupabaseDir, ".env")),
  process.env,
];

const cronSecret = firstEnvValue(envMaps, ["CRON_SECRET"]);

if (!cronSecret) {
  console.log(
    "Local CRON_SECRET not configured in supabase/.env.local, supabase/.env, or OS env.",
  );
  console.log("Disabling shipped local HTTP crons so the local DB does not call stale remote URLs.");
  runSupabaseQuery("disable local active HTTP crons", disableSqlPath);
  inspectLocalCronJobs("inspect local active HTTP crons");
  process.exit(0);
}

const secretBootstrapSql = `-- Local Supabase cron bootstrap
DO $$
DECLARE
  v_secret_id uuid;
BEGIN
  SELECT id INTO v_secret_id
  FROM vault.secrets
  WHERE name = 'holzen_project_url'
  LIMIT 1;

  IF v_secret_id IS NULL THEN
    PERFORM vault.create_secret(
      ${sqlLiteral(localProjectUrl)},
      'holzen_project_url',
      'Local Supabase gateway for shipped HTTP cron jobs'
    );
  ELSE
    PERFORM vault.update_secret(
      v_secret_id,
      ${sqlLiteral(localProjectUrl)},
      'holzen_project_url',
      'Local Supabase gateway for shipped HTTP cron jobs'
    );
  END IF;

  SELECT id INTO v_secret_id
  FROM vault.secrets
  WHERE name = 'CRON_SECRET'
  LIMIT 1;

  IF v_secret_id IS NULL THEN
    PERFORM vault.create_secret(
      ${sqlLiteral(cronSecret)},
      'CRON_SECRET',
      'Local bearer for shipped HTTP cron jobs'
    );
  ELSE
    PERFORM vault.update_secret(
      v_secret_id,
      ${sqlLiteral(cronSecret)},
      'CRON_SECRET',
      'Local bearer for shipped HTTP cron jobs'
    );
  END IF;
END $$;

`;

const { tempDir, tempPath } = writeTempSql(secretBootstrapSql);

try {
  console.log("Local CRON_SECRET detected; rewiring shipped local HTTP crons to the local gateway.");
  runSupabaseQuery("bootstrap local cron secrets", tempPath);
  runSupabaseQuery("rewire local active HTTP crons", rescheduleSqlPath);
  inspectLocalCronJobs("inspect local active HTTP crons");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
