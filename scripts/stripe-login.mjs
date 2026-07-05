#!/usr/bin/env node
/**
 * Stripe CLI login with browser open + long wait (Windows-friendly).
 * Usage: npm run stripe:login
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const candidates = [
  process.env.STRIPE_CLI_PATH,
  join(
    homedir(),
    "AppData/Local/Microsoft/WinGet/Packages/Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe/stripe.exe",
  ),
].filter(Boolean);

const stripe = candidates.find((p) => existsSync(p));
if (!stripe) {
  console.error("Stripe CLI not found. Install: winget install Stripe.StripeCli");
  process.exit(1);
}

const configPath = join(homedir(), ".config/stripe/config.toml");
if (existsSync(configPath)) {
  const check = spawnSync(stripe, ["config", "--list"], { encoding: "utf8" });
  if (check.status === 0) {
    console.log("Stripe CLI already logged in.");
    console.log(check.stdout.trim());
    process.exit(0);
  }
}

const init = spawnSync(stripe, ["login", "--non-interactive"], { encoding: "utf8" });
if (init.status !== 0) {
  console.error(init.stderr || init.stdout);
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(init.stdout.trim());
} catch {
  console.error("Unexpected stripe login output:", init.stdout);
  process.exit(1);
}

console.log(`\nPairing code: ${payload.verification_code}`);
console.log(`Open: ${payload.browser_url}\n`);
console.log("Click **Allow access** in the browser, then leave this window open.\n");

if (process.platform === "win32") {
  spawnSync("cmd", ["/c", "start", "", payload.browser_url], { shell: false });
}

const completeUrl = payload.next_step.replace(/^stripe login --complete /, "").replace(/^'|'$/g, "");

await new Promise((resolve, reject) => {
  const child = spawn(stripe, ["login", "--complete", completeUrl], { stdio: "inherit" });
  child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`login failed (${code})`))));
});

console.log("\nStripe CLI login succeeded.");
spawnSync(stripe, ["config", "--list"], { stdio: "inherit" });
