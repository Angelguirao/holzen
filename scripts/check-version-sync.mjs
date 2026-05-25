#!/usr/bin/env node

import { readFile } from "node:fs/promises";

function readEnvValue(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return null;
}

function requireEnvValue(kind, ...names) {
  const value = readEnvValue(...names);
  if (value) return value;
  throw new Error(
    `Missing Supabase ${kind} for version sync. Set ${names.join(" or ")} before running npm run build.`,
  );
}

function resolveSupabaseConfig() {
  return {
    url: requireEnvValue("URL", "VITE_SUPABASE_URL", "SUPABASE_URL"),
    publishableKey: requireEnvValue(
      "publishable key",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_PUBLISHABLE_KEY",
    ),
  };
}

async function readPackageVersion() {
  const raw = await readFile(new URL("../package.json", import.meta.url), "utf8");
  const pkg = JSON.parse(raw);
  if (!pkg.version || typeof pkg.version !== "string") {
    throw new Error("package.json is missing a valid `version` string.");
  }
  return pkg.version.trim();
}

async function fetchLatestChangelogVersion({ url, publishableKey }) {
  const endpoint = `${url}/rest/v1/changelog_entries?select=version&order=created_at.desc&limit=1`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Supabase request failed (${res.status}): ${body || "no body"}`);
    }

    const rows = await res.json();
    const version = rows?.[0]?.version;
    if (!version || typeof version !== "string") {
      throw new Error("No changelog_entries row found with a valid `version`.");
    }
    return version.trim();
  } finally {
    clearTimeout(timeout);
  }
}

function isChangelogTableMissing(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("PGRST205") || msg.includes("changelog_entries");
}

async function main() {
  const packageVersion = await readPackageVersion();
  const config = resolveSupabaseConfig();
  let changelogVersion;
  try {
    changelogVersion = await fetchLatestChangelogVersion(config);
  } catch (err) {
    if (isChangelogTableMissing(err)) {
      console.warn(
        "Version sync skipped: changelog_entries not on this Supabase project yet (run prod migrations first).",
      );
      return;
    }
    throw err;
  }

  if (packageVersion !== changelogVersion) {
    console.error("Version sync check failed.");
    console.error(`- package.json version: ${packageVersion}`);
    console.error(`- latest changelog version: ${changelogVersion}`);
    console.error(
      "Update package.json `version` to match the latest changelog entry before building."
    );
    process.exit(1);
  }

  console.log(`Version sync ok: ${packageVersion}`);
}

main().catch((err) => {
  console.error(`Version sync check errored: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
