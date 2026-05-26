#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const flags = new Map();
  for (let i = 2; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith("--")) continue;
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      flags.set(current, "true");
      continue;
    }
    flags.set(current, next);
    i += 1;
  }
  return flags;
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
    throw new Error(reason || "supabase status failed");
  }

  const stdout = stripNpmWarnings(result.stdout || "");
  const jsonStart = stdout.indexOf("{");
  if (jsonStart < 0) {
    throw new Error("supabase status returned no JSON payload");
  }

  return JSON.parse(stdout.slice(jsonStart));
}

async function invokeQueue(functionsUrl, serviceRoleKey) {
  const response = await fetch(`${functionsUrl}/process-email-queue`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  const raw = await response.text();
  let body;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    body = { raw };
  }

  if (!response.ok) {
    if (
      response.status === 500 &&
      body &&
      typeof body === "object" &&
      body.error === "Server configuration error"
    ) {
      throw new Error(
        "process-email-queue returned 500 Server configuration error. " +
          "Locally this usually means `npm run supabase:functions:serve` needs a restart " +
          "after editing `supabase/.env.local`, or `RESEND_API_KEY` is still missing there.",
      );
    }
    throw new Error(
      `process-email-queue failed (${response.status}): ${typeof body === "object" ? JSON.stringify(body) : String(body)}`,
    );
  }

  return body;
}

const flags = parseArgs(process.argv);
const untilEmpty = flags.has("--until-empty");
const maxRunsRaw = flags.get("--max-runs") ?? "10";
const maxRuns = Number.parseInt(maxRunsRaw, 10);

if (!Number.isFinite(maxRuns) || maxRuns <= 0) {
  console.error(`Invalid --max-runs value: ${maxRunsRaw}`);
  process.exit(1);
}

const status = readLocalStatus();
const functionsUrl = status.FUNCTIONS_URL;
const serviceRoleKey = status.SERVICE_ROLE_KEY;

if (!functionsUrl || !serviceRoleKey) {
  console.error("Local Supabase status is missing FUNCTIONS_URL or SERVICE_ROLE_KEY.");
  process.exit(1);
}

let run = 0;
while (run < maxRuns) {
  run += 1;
  console.log(`Run ${run}: POST ${functionsUrl}/process-email-queue`);
  const body = await invokeQueue(functionsUrl, serviceRoleKey);
  console.log(JSON.stringify(body, null, 2));

  const processed =
    body && typeof body === "object" && typeof body.processed === "number"
      ? body.processed
      : 0;
  const stopped =
    body && typeof body === "object" && typeof body.stopped === "string"
      ? body.stopped
      : "";

  if (!untilEmpty) break;
  if (stopped) {
    console.log(`Stopped because worker returned: ${stopped}`);
    break;
  }
  if (processed <= 0) {
    console.log("Queue appears empty.");
    break;
  }
}

if (untilEmpty && run >= maxRuns) {
  console.log(`Reached --max-runs=${maxRuns}.`);
}
