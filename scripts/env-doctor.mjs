#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { readDotenvFile } from "./parse-dotenv.mjs";
import { SUPABASE_PROJECT_REFS } from "./lib/supabase-targets.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readRepoConfigProjectId() {
  const configPath = join(root, "supabase", "config.toml");
  const content = readFileSync(configPath, "utf8");
  const match = content.match(/^\s*project_id\s*=\s*"([^"]+)"/m);
  return match?.[1] ?? "(missing)";
}

function mergeEnvFiles(paths) {
  return Object.assign({}, ...paths.map((path) => readDotenvFile(path)));
}

function describeFrontendTarget(env) {
  const projectId = env.VITE_SUPABASE_PROJECT_ID?.trim() || "";
  const url = env.VITE_SUPABASE_URL?.trim() || "";

  let kind = "unset";
  if (projectId || url) {
    if (projectId === "local" || /127\.0\.0\.1:55421/.test(url)) kind = "local";
    else if (projectId === SUPABASE_PROJECT_REFS.staging || url.includes(SUPABASE_PROJECT_REFS.staging)) kind = "staging";
    else if (projectId === SUPABASE_PROJECT_REFS.production || url.includes(SUPABASE_PROJECT_REFS.production)) kind = "production";
    else if (url.includes("supabase.co")) kind = "custom hosted";
    else kind = "custom";
  }

  return {
    kind,
    projectId: projectId || "unset",
    url: url || "unset",
  };
}

function readLinkedProject() {
  const projectPath = join(root, ".supabase", "project.json");
  if (!existsSync(projectPath)) return null;
  try {
    return JSON.parse(readFileSync(projectPath, "utf8"));
  } catch {
    return { invalid: true, path: projectPath };
  }
}

function stripNpmWarnings(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith("npm warn "))
    .join("\n")
    .trim();
}

function readLocalStatus() {
  const result = spawnSync("npx", ["supabase", "status", "-o", "json"], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    const reason = stripNpmWarnings(result.stderr || result.stdout || "");
    if (reason.includes("No such container: supabase_db_holzen")) {
      return {
        running: false,
        reason: "current local stack is not running for project_id=holzen (restart with `npm run supabase:start` after the config update)",
      };
    }
    return { running: false, reason: reason || "status command failed" };
  }

  const stdout = stripNpmWarnings(result.stdout || "");
  const jsonStart = stdout.indexOf("{");
  if (jsonStart < 0) {
    return { running: false, reason: "status returned no JSON payload" };
  }

  try {
    const parsed = JSON.parse(stdout.slice(jsonStart));
    return {
      running: true,
      apiUrl: parsed.API_URL || "",
      studioUrl: parsed.STUDIO_URL || "",
      functionsUrl: parsed.FUNCTIONS_URL || "",
      notes: stdout.slice(0, jsonStart).trim(),
    };
  } catch {
    return { running: false, reason: "status JSON could not be parsed" };
  }
}

function printMode(label, env) {
  const target = describeFrontendTarget(env);
  console.log(`- ${label}: ${target.kind}`);
  console.log(`  project id: ${target.projectId}`);
  console.log(`  url: ${target.url}`);
}

const baseEnvPaths = [join(root, ".env"), join(root, ".env.local")];
const defaultEnv = mergeEnvFiles(baseEnvPaths);
const stagingEnv = mergeEnvFiles([...baseEnvPaths, join(root, ".env.staging"), join(root, ".env.staging.local")]);
const prodEnv = mergeEnvFiles([...baseEnvPaths, join(root, ".env.prod"), join(root, ".env.prod.local")]);
const localEnv = mergeEnvFiles([...baseEnvPaths, join(root, ".env.localstack"), join(root, ".env.localstack.local")]);
const linkedProject = readLinkedProject();
const localStatus = readLocalStatus();

console.log("Holzen env doctor");
console.log("");

console.log("Supabase config");
console.log(`- repo config project_id: ${readRepoConfigProjectId()}`);
console.log(`- staging ref: ${SUPABASE_PROJECT_REFS.staging}`);
console.log(`- production ref: ${SUPABASE_PROJECT_REFS.production}`);
if (!linkedProject) {
  console.log("- linked remote: none (.supabase/project.json not found)");
} else if (linkedProject.invalid) {
  console.log(`- linked remote: unreadable metadata at ${linkedProject.path}`);
} else {
  console.log(`- linked remote: ${linkedProject.name || "(unnamed)"} (${linkedProject.ref || "unknown ref"})`);
}

console.log("");
console.log("Frontend targets");
printMode("npm run dev", defaultEnv);
printMode("npm run dev:staging", stagingEnv);
printMode("npm run dev:prod", prodEnv);
printMode("npm run dev:local", localEnv);

console.log("");
console.log("Local Supabase");
if (!localStatus.running) {
  console.log(`- status: not running (${localStatus.reason})`);
} else {
  console.log("- status: running");
  if (localStatus.apiUrl) console.log(`  API: ${localStatus.apiUrl}`);
  if (localStatus.functionsUrl) console.log(`  Functions: ${localStatus.functionsUrl}`);
  if (localStatus.studioUrl) console.log(`  Studio: ${localStatus.studioUrl}`);
  if (localStatus.notes) console.log(`  note: ${localStatus.notes}`);
}

console.log("");
console.log("Vercel preview sync");
console.log("- default: npm run vercel:sync-env writes Preview vars to All Previews");
console.log("- optional: pass --preview-branch=<branch> to scope values to specific branches");
