#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readProjectId() {
  const config = readFileSync(join(root, "supabase", "config.toml"), "utf8");
  const match = config.match(/^project_id\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error("Could not read project_id from supabase/config.toml");
  }
  return match[1];
}

export function localDbContainerName() {
  return `supabase_db_${readProjectId()}`;
}

function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* spin */
  }
}

function isContainerRunning(container) {
  const inspect = spawnSync("docker", ["inspect", "-f", "{{.State.Running}}", container], {
    cwd: root,
    stdio: "pipe",
    shell: process.platform === "win32",
  });
  return inspect.status === 0 && inspect.stdout?.toString().trim() === "true";
}

/** Wait until Postgres inside the local Supabase DB container accepts connections. */
export function waitForLocalPostgres({ maxAttempts = 45, delayMs = 1000 } = {}) {
  const container = localDbContainerName();
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (!isContainerRunning(container)) {
      if (attempt === maxAttempts) {
        throw new Error(
          `Local DB container ${container} is not running. Run npm run supabase:stop && npm run supabase:start.`,
        );
      }
      sleepMs(delayMs);
      continue;
    }

    const ready = spawnSync("docker", ["exec", container, "pg_isready", "-U", "postgres"], {
      cwd: root,
      stdio: "pipe",
      shell: process.platform === "win32",
    });
    if (ready.status === 0) {
      return;
    }
    if (attempt === maxAttempts) {
      throw new Error(
        `Local Postgres not ready after ${maxAttempts} attempts (container ${container}).`,
      );
    }
    sleepMs(delayMs);
  }
}

function runViaDockerExec(container, filePath) {
  const sql = readFileSync(filePath, "utf8");
  return spawnSync(
    "docker",
    ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"],
    {
      cwd: root,
      input: sql,
      stdio: ["pipe", "inherit", "inherit"],
      shell: process.platform === "win32",
    },
  );
}

function runViaSupabaseCli(filePath) {
  return spawnSync("npx", ["supabase", "db", "query", "--local", "--file", filePath], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

/** Run a SQL file against the local Supabase Postgres (CLI with docker exec fallback). */
export function runLocalSupabaseSqlFile(label, filePath) {
  console.log(`\n▶ ${label}`);

  const container = localDbContainerName();
  const preferDocker =
    process.platform === "win32" || process.env.HOLZEN_LOCAL_DB_DOCKER === "1";

  let result = preferDocker ? { status: 1 } : runViaSupabaseCli(filePath);

  if (result.status !== 0) {
    if (!isContainerRunning(container)) {
      console.error(`\n✗ ${label} failed — local DB container ${container} is not running`);
      process.exit(result.status ?? 1);
    }
    if (!preferDocker) {
      console.log(
        "Supabase CLI could not reach local Postgres; retrying via docker exec " +
          `(common on Windows when 127.0.0.1:55422 port-forward hangs).`,
      );
    }
    result = runViaDockerExec(container, filePath);
  }

  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed (exit ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }

  console.log(`✓ ${label}`);
}
