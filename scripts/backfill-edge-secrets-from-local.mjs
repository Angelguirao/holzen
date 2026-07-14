#!/usr/bin/env node
/**
 * Fill empty keys in .env.*.secrets from supabase/.env.local (and sibling secrets file).
 * Does not print secret values.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDotenv } from "./parse-dotenv.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sources = [
  join(root, "supabase/.env.local"),
  join(root, "supabase/.env"),
];

function load(path) {
  if (!existsSync(path)) return {};
  return parseDotenv(readFileSync(path, "utf8"));
}

function backfill(targetPath, extraSources = []) {
  if (!existsSync(targetPath)) {
    console.error(`Missing ${targetPath}`);
    return { filled: 0, stillEmpty: [] };
  }

  const lines = readFileSync(targetPath, "utf8").split(/\r?\n/);
  const current = load(targetPath);
  const pool = { ...current };
  for (const src of [...extraSources, ...sources]) {
    for (const [k, v] of Object.entries(load(src))) {
      if (v?.trim() && !pool[k]?.trim()) pool[k] = v.trim();
    }
  }

  const filled = [];
  const stillEmpty = [];
  const out = lines.map((line) => {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) return line;
    const key = m[1];
    const had = current[key]?.trim();
    const next = pool[key]?.trim();
    if (!had && next) {
      filled.push(key);
      return `${key}=${next}`;
    }
    if (!next && /^[A-Z]/.test(key)) stillEmpty.push(key);
    return line;
  });

  if (filled.length > 0) {
    writeFileSync(targetPath, out.join("\n"));
  }

  return { filled, stillEmpty: stillEmpty.filter((k) => !pool[k]?.trim()) };
}

const stagingPath = join(root, ".env.staging.secrets");
const prodPath = join(root, ".env.prod.secrets");

const staging = backfill(stagingPath);
const prod = backfill(prodPath, [stagingPath]);

for (const [label, { filled, stillEmpty }] of [
  ["staging", staging],
  ["prod", prod],
]) {
  console.log(`${label}: filled ${filled.length} key(s)${filled.length ? ` (${filled.join(", ")})` : ""}`);
  const blocking = stillEmpty.filter((k) =>
    [
      "RESEND_API_KEY",
      "SEND_EMAIL_HOOK_SECRET",
      "CRON_SECRET",
      "SENTRY_DSN_EDGES",
      "LOG_DRAIN_URL",
      "LOG_DRAIN_TOKEN",
      "SLACK_WEBHOOK_URL",
      "OPENROUTER_API_KEY",
    ].includes(k),
  );
  if (blocking.length) {
    console.log(`${label}: still empty (blocking): ${blocking.join(", ")}`);
  }
}
