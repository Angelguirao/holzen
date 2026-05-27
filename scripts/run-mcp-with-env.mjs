#!/usr/bin/env node
/**
 * Load gitignored MCP env files, alias Gemini key names, then exec the MCP server.
 *
 * Usage: node scripts/run-mcp-with-env.mjs [--env relative/or/abs/path]... -- command [args...]
 *
 * Default env file: .cursor/mcp-secrets.env (also loads legacy .cursor/ionos.env if present).
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

/** Legacy mcp-secrets may still list GOOGLE_AI_API_KEY — map to GEMINI for aistudio MCP only. */
function aliasGeminiKeys() {
  const legacyGoogle = process.env.GOOGLE_AI_API_KEY?.trim();
  const gemini = process.env.GEMINI_API_KEY?.trim();
  if (!gemini && legacyGoogle) process.env.GEMINI_API_KEY = legacyGoogle;
}

const argv = process.argv.slice(2);
const sep = argv.indexOf("--");
if (sep === -1) {
  console.error(
    "Usage: node scripts/run-mcp-with-env.mjs [--env path]... -- command [args...]",
  );
  process.exit(1);
}

const envPaths = [
  path.join(repoRoot, ".cursor", "mcp-secrets.env"),
  path.join(repoRoot, ".cursor", "ionos.env"),
];

for (let i = 0; i < sep; i++) {
  if (argv[i] === "--env" && argv[i + 1]) {
    const next = argv[i + 1];
    envPaths.push(path.isAbsolute(next) ? next : path.join(repoRoot, next));
    i++;
  }
}

for (const envPath of envPaths) loadEnvFile(envPath);
aliasGeminiKeys();

const command = argv.slice(sep + 1);
if (command.length === 0) {
  console.error("Missing command after --");
  process.exit(1);
}

const child = spawn(command[0], command.slice(1), {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
  cwd: repoRoot,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
