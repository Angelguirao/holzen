#!/usr/bin/env node
/**
 * Bootstrap Cursor MCP config and secrets for Holzen.
 *
 * Usage:
 *   npm run mcp:setup              # sync + patch mcp.json + prompt for Gemini if missing
 *   npm run mcp:setup -- --check   # validate only
 *   npm run mcp:setup -- --open    # open Google AI Studio when key missing
 *   npm run mcp:setup -- --key AIza...  # non-interactive key (prefer env files)
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import { parseDotenv, serializeMcpSecrets } from "./parse-dotenv.mjs";
import { syncMcpSecrets } from "./sync-mcp-secrets.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cursorDir = path.join(repoRoot, ".cursor");
const mcpJsonPath = path.join(cursorDir, "mcp.json");
const mcpExamplePath = path.join(cursorDir, "mcp.json.example");
const secretsPath = path.join(cursorDir, "mcp-secrets.env");
const secretsExamplePath = path.join(cursorDir, "mcp-secrets.env.example");
const stagingSecretsPath = path.join(repoRoot, ".env.staging.secrets");
const stagingSecretsExamplePath = path.join(repoRoot, ".env.staging.secrets.example");

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const openBrowser = args.has("--open") || (!checkOnly && !args.has("--no-open"));
const keyArgIndex = process.argv.indexOf("--key");
const keyFromCli = keyArgIndex >= 0 ? process.argv[keyArgIndex + 1]?.trim() : "";

function ensureFile(from, to, label) {
  if (existsSync(to)) return false;
  if (!existsSync(from)) {
    console.error(`Missing template: ${from}`);
    process.exit(1);
  }
  copyFileSync(from, to);
  console.log(`Created ${label} from example`);
  return true;
}

function patchMcpJsonIonosPath(ionosPath) {
  if (!existsSync(mcpJsonPath)) return;
  const normalized = ionosPath.replace(/\\/g, "/");
  const config = JSON.parse(readFileSync(mcpJsonPath, "utf8"));
  const ionos = config.mcpServers?.ionos;
  if (!ionos?.args) return;
  const nodeIndex = ionos.args.indexOf("node");
  if (nodeIndex >= 0 && ionos.args[nodeIndex + 1]) {
    ionos.args[nodeIndex + 1] = normalized;
    writeFileSync(mcpJsonPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    console.log(`Updated ionos MCP path in mcp.json`);
  }
}

function openAiStudio() {
  const url = "https://aistudio.google.com/apikey";
  console.log(`Opening ${url} — create or copy an API key, then paste below.`);
  if (process.platform === "win32") {
    spawnSync("cmd", ["/c", "start", "", url], { stdio: "ignore", shell: true });
  } else if (process.platform === "darwin") {
    spawnSync("open", [url], { stdio: "ignore" });
  } else {
    spawnSync("xdg-open", [url], { stdio: "ignore" });
  }
}

async function promptForGeminiKey() {
  if (!process.stdin.isTTY) return "";
  const rl = readline.createInterface({ input, output });
  try {
    const key = await rl.question("Paste GEMINI_API_KEY (Google AI Studio): ");
    return key.trim();
  } finally {
    rl.close();
  }
}

function writeGeminiKey(key) {
  const current = existsSync(secretsPath)
    ? parseDotenv(readFileSync(secretsPath, "utf8"))
    : {};
  current.GEMINI_API_KEY = key;
  const header = [
    "# Local MCP secrets — do not commit (see mcp-secrets.env.example)",
    "# Updated by: npm run mcp:setup",
  ];
  writeFileSync(secretsPath, serializeMcpSecrets(current, header), "utf8");
}

function probeEnv() {
  const probe = spawnSync(
    "node",
    [
      path.join(repoRoot, "scripts/run-mcp-with-env.mjs"),
      "--",
      "node",
      "-p",
      "JSON.stringify({ionos:!!process.env.IONOS_API_KEY,gemini:!!process.env.GEMINI_API_KEY})",
    ],
    { cwd: repoRoot, encoding: "utf8", shell: true },
  );
  try {
    return JSON.parse(probe.stdout?.trim() || "{}");
  } catch {
    return { ionos: false, gemini: false };
  }
}

async function main() {
  mkdirSync(cursorDir, { recursive: true });
  ensureFile(mcpExamplePath, mcpJsonPath, "mcp.json");
  ensureFile(secretsExamplePath, secretsPath, "mcp-secrets.env");
  if (ensureFile(stagingSecretsExamplePath, stagingSecretsPath, ".env.staging.secrets")) {
    console.log(
      "Add OPENROUTER_API_KEY to .env.staging.secrets for edge LLM (see docs/ops/llm-openrouter.md).",
    );
  }

  let result = syncMcpSecrets();

  if (keyFromCli) {
    writeGeminiKey(keyFromCli);
    result = syncMcpSecrets();
  }

  patchMcpJsonIonosPath(result.merged.IONOS_MCP_PATH);

  if (!result.hasGemini && !checkOnly) {
    if (openBrowser) openAiStudio();
    const pasted = await promptForGeminiKey();
    if (pasted) {
      writeGeminiKey(pasted);
      result = syncMcpSecrets();
    }
  }

  const probe = probeEnv();
  console.log("\nMCP status:");
  console.log(`  mcp.json: ${existsSync(mcpJsonPath) ? "ok" : "missing"}`);
  console.log(`  mcp-secrets.env: ${existsSync(secretsPath) ? "ok" : "missing"}`);
  console.log(`  IONOS key loaded: ${probe.ionos ? "ok" : "missing"}`);
  console.log(`  Gemini key loaded: ${probe.gemini ? "ok" : "missing"}`);
  console.log(`  IONOS binary: ${result.ionosPathExists ? "ok" : "missing"}`);

  if (!probe.gemini) {
    console.log("\nGEMINI_API_KEY missing (optional — only for Cursor aistudio MCP). Options:");
    console.log("  1. npm run mcp:setup -- --key YOUR_KEY");
    console.log("  2. Set GEMINI_API_KEY in .cursor/mcp-secrets.env manually");
    console.log("  Edge LLM uses OPENROUTER_API_KEY — npm run edge:env:bootstrap");
  }

  console.log("\nRestart Cursor to reload MCP servers.");
  process.exit(probe.ionos ? 0 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
