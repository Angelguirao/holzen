#!/usr/bin/env node
/**
 * Merge Gemini / IONOS keys into .cursor/mcp-secrets.env from local env files.
 *
 * Sources (first non-empty wins per key):
 *   existing .cursor/mcp-secrets.env → .env.staging.secrets → .env.prod.secrets
 *   → other .env.*.local → process.env
 *
 * Usage: npm run mcp:sync-secrets
 */
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  firstEnvValue,
  readDotenvFile,
  serializeMcpSecrets,
} from "./parse-dotenv.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cursorDir = path.join(repoRoot, ".cursor");
const secretsPath = path.join(cursorDir, "mcp-secrets.env");

const SOURCE_FILES = [
  ".env.staging.secrets",
  ".env.prod.secrets",
  ".env.staging.local",
  ".env.prod.local",
  ".env.prod",
  ".env.localstack",
  ".env",
  ".cursor/ionos.env",
];

function detectIonosMcpPath() {
  const fromEnv = process.env.IONOS_MCP_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const home = process.env.USERPROFILE || process.env.HOME || "";
  const candidates = [
    path.join(home, "tools", "ionos-mcp", "build", "index.js"),
    "C:/Users/angel/tools/ionos-mcp/build/index.js",
  ];
  return candidates.find((p) => p && existsSync(p)) ?? candidates[0];
}

function loadSources() {
  const maps = [readDotenvFile(secretsPath)];
  for (const rel of SOURCE_FILES) {
    maps.push(readDotenvFile(path.join(repoRoot, rel)));
  }
  maps.push({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY ?? "",
    IONOS_API_KEY: process.env.IONOS_API_KEY ?? "",
    IONOS_MCP_PATH: process.env.IONOS_MCP_PATH ?? "",
  });
  return maps;
}

export function syncMcpSecrets({ write = true } = {}) {
  mkdirSync(cursorDir, { recursive: true });
  const maps = loadSources();

  const gemini =
    firstEnvValue(maps, ["GEMINI_API_KEY", "GOOGLE_AI_API_KEY"]) || "";
  const ionosKey = firstEnvValue(maps, ["IONOS_API_KEY"]) || "";
  const ionosPath =
    firstEnvValue(maps, ["IONOS_MCP_PATH"]) || detectIonosMcpPath();

  const merged = {
    GEMINI_API_KEY: gemini,
    GOOGLE_AI_API_KEY: gemini,
    IONOS_API_KEY: ionosKey,
    IONOS_MCP_PATH: ionosPath.replace(/\\/g, "/"),
  };

  const header = [
    "# Local MCP secrets — do not commit (see mcp-secrets.env.example)",
    "# Updated by: npm run mcp:sync-secrets",
  ];

  if (write) {
    writeFileSync(secretsPath, serializeMcpSecrets(merged, header), "utf8");
  }

  return {
    secretsPath,
    merged,
    hasGemini: Boolean(gemini),
    hasIonos: Boolean(ionosKey),
    ionosPathExists: existsSync(merged.IONOS_MCP_PATH),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = syncMcpSecrets();
  console.log(`Wrote ${path.relative(repoRoot, result.secretsPath)}`);
  console.log(
    `  GEMINI_API_KEY: ${result.hasGemini ? "ok" : "missing — create at https://aistudio.google.com/apikey"}`,
  );
  console.log(`  IONOS_API_KEY: ${result.hasIonos ? "ok" : "missing"}`);
  console.log(
    `  IONOS_MCP_PATH: ${result.ionosPathExists ? "found" : "missing"} (${result.merged.IONOS_MCP_PATH})`,
  );
  process.exit(result.hasGemini && result.hasIonos ? 0 : 1);
}
