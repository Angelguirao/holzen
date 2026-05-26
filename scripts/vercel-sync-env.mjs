#!/usr/bin/env node
/** Sync holzen Vercel env vars from local gitignored files. */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const previewBranches = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--preview-branch") {
      const value = argv[i + 1]?.trim();
      if (value) {
        previewBranches.push(value);
        i += 1;
      }
      continue;
    }
    if (arg.startsWith("--preview-branch=")) {
      const value = arg.split("=")[1]?.trim();
      if (value) previewBranches.push(value);
    }
  }
  return { previewBranches };
}

function parseEnv(path) {
  const map = {};
  if (!existsSync(path)) return map;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"#]*)"?/);
    if (m) map[m[1]] = m[2].trim();
  }
  return map;
}

function add(name, value, environment, gitBranch) {
  if (value === undefined || value === null) return;
  const branchLabel = gitBranch ? ` preview@${gitBranch}` : "";
  console.log(`→ ${name} (${environment}${branchLabel})`);
  const valueArg = JSON.stringify(String(value));
  const cmd = [
    "npx vercel@latest env add",
    name,
    environment,
    ...(gitBranch ? [JSON.stringify(gitBranch)] : []),
    "--value",
    valueArg,
    "--yes",
    "--no-sensitive",
    "--force",
  ].join(" ");
  execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120_000 });
}

const prod = {
  ...parseEnv(join(root, ".env.prod")),
  ...parseEnv(join(root, ".env.prod.local")),
};
const staging = parseEnv(join(root, ".env.staging.local"));
const { previewBranches } = parseArgs(process.argv.slice(2));

console.log("Production…");
add("VITE_SUPABASE_URL", "https://geqkxsnyqvhtascjghuu.supabase.co", "production");
add("VITE_SUPABASE_PROJECT_ID", "geqkxsnyqvhtascjghuu", "production");
add("VITE_SUPABASE_PUBLISHABLE_KEY", prod.VITE_SUPABASE_PUBLISHABLE_KEY, "production");
add("VITE_APP_VERSION", "$VERCEL_GIT_COMMIT_SHA", "production");
add("VITE_SITE_ORIGIN", "https://holzen.app", "production");
add("VITE_ADMIN_USER_IDS", prod.VITE_ADMIN_USER_IDS, "production");
add("VITE_POSTHOG_KEY", prod.VITE_POSTHOG_KEY, "production");
add("VITE_POSTHOG_HOST", prod.VITE_POSTHOG_HOST, "production");

function syncPreviewEnvironment(gitBranch) {
  console.log(gitBranch ? `Preview (branch: ${gitBranch})…` : "Preview (all previews)…");
  add("VITE_SUPABASE_URL", "https://ksplyxxdvandkwzundql.supabase.co", "preview", gitBranch);
  add("VITE_SUPABASE_PROJECT_ID", "ksplyxxdvandkwzundql", "preview", gitBranch);
  add("VITE_SUPABASE_PUBLISHABLE_KEY", staging.VITE_SUPABASE_PUBLISHABLE_KEY, "preview", gitBranch);
  add("VITE_APP_VERSION", "$VERCEL_GIT_COMMIT_SHA", "preview", gitBranch);
  add("VITE_ADMIN_USER_IDS", staging.VITE_ADMIN_USER_IDS ?? "", "preview", gitBranch);
  add("VITE_POSTHOG_KEY", prod.VITE_POSTHOG_KEY, "preview", gitBranch);
  add("VITE_POSTHOG_HOST", prod.VITE_POSTHOG_HOST, "preview", gitBranch);
}

if (previewBranches.length === 0) {
  syncPreviewEnvironment();
} else {
  for (const previewBranch of previewBranches) {
    syncPreviewEnvironment(previewBranch);
  }
}

console.log("Done.");
