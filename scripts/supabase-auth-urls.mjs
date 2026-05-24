#!/usr/bin/env node
/**
 * Sync Supabase Auth URL config (site_url + redirect allow list) for prod + staging.
 * Requires SUPABASE_ACCESS_TOKEN (npx supabase login) or pass via env.
 *
 * Usage:
 *   node scripts/supabase-auth-urls.mjs
 *   node scripts/supabase-auth-urls.mjs --dry-run
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");

const REDIRECT_ALLOW_LIST = [
  "https://holzen.app/**",
  "https://www.holzen.app/**",
  "http://localhost:8080/**",
  "http://127.0.0.1:8080/**",
  "https://*.vercel.app/**",
].join(",");

const PROJECTS = [
  { ref: "geqkxsnyqvhtascjghuu", label: "production", siteUrl: "https://holzen.app" },
  { ref: "ksplyxxdvandkwzundql", label: "staging", siteUrl: "https://holzen.app" },
];

function loadToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN;
  const candidates = [
    join(process.env.APPDATA ?? "", "supabase", "access-token"),
    join(process.env.USERPROFILE ?? "", ".supabase", "access-token"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, "utf8").trim();
  }
  return null;
}

async function getAuthConfig(token, ref) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${ref} GET auth config: ${res.status} ${await res.text()}`);
  return res.json();
}

async function patchAuthConfig(token, ref, body) {
  if (dryRun) {
    console.log(`[dry-run] PATCH ${ref}:`, JSON.stringify(body, null, 2));
    return body;
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${ref} PATCH auth config: ${res.status} ${await res.text()}`);
  return res.json();
}

function mergeAllowList(existing) {
  const current = (existing ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const needed = REDIRECT_ALLOW_LIST.split(",").map((s) => s.trim());
  const merged = [...new Set([...current, ...needed])];
  return merged.join(",");
}

const token = loadToken();
if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN. Run: npx supabase login");
  process.exit(1);
}

for (const { ref, label, siteUrl } of PROJECTS) {
  console.log(`\n${label} (${ref})…`);
  const current = await getAuthConfig(token, ref);
  const next = {
    site_url: siteUrl,
    uri_allow_list: mergeAllowList(current.uri_allow_list),
  };
  console.log(`  site_url: ${current.site_url ?? "(unset)"} → ${next.site_url}`);
  console.log(`  uri_allow_list entries: ${next.uri_allow_list.split(",").length}`);
  await patchAuthConfig(token, ref, next);
  console.log(`  ✓ updated`);
}

console.log("\nDone.");
