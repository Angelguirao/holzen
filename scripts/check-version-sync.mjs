#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

async function readPackageVersion() {
  const raw = await readFile(new URL("../package.json", import.meta.url), "utf8");
  const pkg = JSON.parse(raw);
  if (!pkg.version || typeof pkg.version !== "string") {
    throw new Error("package.json is missing a valid `version` string.");
  }
  return pkg.version.trim();
}

async function main() {
  const packageVersion = await readPackageVersion();
  if (!SEMVER_PATTERN.test(packageVersion)) {
    console.error("Version sync check failed.");
    console.error(`- package.json version is not valid semver: ${packageVersion}`);
    process.exit(1);
  }

  console.log(`Version sync ok: ${packageVersion}`);
}

main().catch((err) => {
  console.error(`Version sync check errored: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
