#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const FALLBACK_SUPABASE_URL = "https://edgbwdecaoottowliimu.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZ2J3ZGVjYW9vdHRvd2xpaW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzgyMzcsImV4cCI6MjA4ODMxNDIzN30.ZNh2feSmMhdZmEk6omdd8q5HDjBHytz-gzktI0txwM8";

function resolveSupabaseConfig() {
  return {
    url:
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      FALLBACK_SUPABASE_URL,
    publishableKey:
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      FALLBACK_SUPABASE_PUBLISHABLE_KEY,
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

async function main() {
  const packageVersion = await readPackageVersion();
  const config = resolveSupabaseConfig();
  const changelogVersion = await fetchLatestChangelogVersion(config);

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
