#!/usr/bin/env node
/** Back-compat wrapper — use check-cicd-env.mjs directly. */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "check-cicd-env.mjs");
const args = [...process.argv.slice(2)];
if (!args.some((a) => a.startsWith("--platform="))) {
  args.push("--platform=github");
}
const result = spawnSync(process.execPath, [script, ...args], { stdio: "inherit" });
process.exit(result.status ?? 1);
