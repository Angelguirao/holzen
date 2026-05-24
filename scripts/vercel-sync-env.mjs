#!/usr/bin/env node
/** Sync holzen Vercel env vars from local gitignored files. */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnv(path) {
  const map = {};
  if (!existsSync(path)) return map;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"#]*)"?/);
    if (m) map[m[1]] = m[2].trim();
  }
  return map;
}

function add(name, value, environment) {
  if (!value) return;
  console.log(`→ ${name} (${environment})`);
  execFileSync(
    "npx",
    ["vercel@latest", "env", "add", name, environment, "--value", value, "--yes", "--no-sensitive", "--force"],
    { cwd: root, stdio: "inherit", shell: true },
  );
}

const hosted = parseEnv(join(root, ".env.hosted"));
const staging = parseEnv(join(root, ".env.staging.local"));

console.log("Production…");
add("VITE_SUPABASE_URL", "https://geqkxsnyqvhtascjghuu.supabase.co", "production");
add("VITE_SUPABASE_PROJECT_ID", "geqkxsnyqvhtascjghuu", "production");
add("VITE_SUPABASE_PUBLISHABLE_KEY", hosted.VITE_SUPABASE_PUBLISHABLE_KEY, "production");
add("VITE_APP_VERSION", "$VERCEL_GIT_COMMIT_SHA", "production");
add("VITE_SITE_ORIGIN", "https://holzen.app", "production");
add("VITE_ADMIN_USER_IDS", hosted.VITE_ADMIN_USER_IDS, "production");
add("VITE_POSTHOG_KEY", hosted.VITE_POSTHOG_KEY, "production");
add("VITE_POSTHOG_HOST", hosted.VITE_POSTHOG_HOST, "production");

console.log("Preview…");
add("VITE_SUPABASE_URL", "https://ksplyxxdvandkwzundql.supabase.co", "preview");
add("VITE_SUPABASE_PROJECT_ID", "ksplyxxdvandkwzundql", "preview");
add("VITE_SUPABASE_PUBLISHABLE_KEY", staging.VITE_SUPABASE_PUBLISHABLE_KEY, "preview");
add("VITE_APP_VERSION", "$VERCEL_GIT_COMMIT_SHA", "preview");
add("VITE_ADMIN_USER_IDS", staging.VITE_ADMIN_USER_IDS ?? "", "preview");
add("VITE_POSTHOG_KEY", hosted.VITE_POSTHOG_KEY, "preview");
add("VITE_POSTHOG_HOST", hosted.VITE_POSTHOG_HOST, "preview");

console.log("Done.");
