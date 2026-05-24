#!/usr/bin/env node
/**
 * Run Stripe CLI from the WinGet install path (Windows PATH may need a new shell).
 * Usage: npm run stripe:login | node scripts/stripe-cli.mjs <stripe-args>
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const candidates = [
  process.env.STRIPE_CLI_PATH,
  join(
    homedir(),
    "AppData/Local/Microsoft/WinGet/Packages/Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe/stripe.exe",
  ),
  join(homedir(), "AppData/Local/Microsoft/WinGet/Links/stripe.exe"),
].filter(Boolean);

const stripe = candidates.find((p) => existsSync(p));
if (!stripe) {
  console.error(
    "Stripe CLI not found. Install: winget install Stripe.StripeCli — then reopen the terminal or set STRIPE_CLI_PATH.",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const result = spawnSync(stripe, args, { stdio: "inherit", shell: false });
process.exit(result.status ?? 1);
