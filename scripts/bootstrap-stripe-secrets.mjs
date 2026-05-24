#!/usr/bin/env node
/**
 * Create Stripe webhooks, resolve v1 price IDs, push secrets to Supabase.
 *
 * Auth (first match wins):
 * 1. Stripe CLI login → reads test_mode_api_key / live_mode_api_key from `stripe config --list`
 * 2. `.env.stripe.bootstrap` or env: STRIPE_TEST_SECRET_KEY, STRIPE_LIVE_SECRET_KEY
 *
 * Usage: npm run stripe:bootstrap-secrets
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const STAGING_REF = "ksplyxxdvandkwzundql";
const PROD_REF = "geqkxsnyqvhtascjghuu";
const STAGING_WEBHOOK = `https://${STAGING_REF}.supabase.co/functions/v1/stripe-webhook`;
const PROD_WEBHOOK = `https://${PROD_REF}.supabase.co/functions/v1/stripe-webhook`;

const EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

function loadBootstrapEnv() {
  const path = join(process.cwd(), ".env.stripe.bootstrap");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const k = trimmed.slice(0, i).trim();
    const v = trimmed.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

function stripeCli() {
  const candidates = [
    process.env.STRIPE_CLI_PATH,
    join(
      homedir(),
      "AppData/Local/Microsoft/WinGet/Packages/Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe/stripe.exe",
    ),
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p));
}

function keysFromCli() {
  const cli = stripeCli();
  const configPath = join(homedir(), ".config/stripe/config.toml");
  if (!cli || !existsSync(configPath)) return null;

  const toml = readFileSync(configPath, "utf8");
  const test =
    toml.match(/test_mode_api_key\s*=\s*['"](sk_test_[^'"]+)['"]/)?.[1] ||
    process.env.STRIPE_TEST_SECRET_KEY;
  const live =
    toml.match(/live_mode_api_key\s*=\s*['"]((?:sk_live|rk_live)_[^'"]+)['"]/)?.[1] ||
    process.env.STRIPE_LIVE_SECRET_KEY;
  if (test?.includes("*") || live?.includes("*")) {
    return {
      test: test?.includes("*") ? process.env.STRIPE_TEST_SECRET_KEY : test,
      live: live?.includes("*") ? process.env.STRIPE_LIVE_SECRET_KEY : live,
    };
  }
  return { test, live };
}

function resolveKeys() {
  loadBootstrapEnv();
  const fromCli = keysFromCli();
  return {
    test: process.env.STRIPE_TEST_SECRET_KEY || fromCli?.test,
    live: process.env.STRIPE_LIVE_SECRET_KEY || fromCli?.live,
  };
}

async function stripeApi(secretKey, method, path, form = null) {
  const headers = { Authorization: `Bearer ${secretKey}` };
  let body;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(form).toString();
  }
  const res = await fetch(`https://api.stripe.com/v1${path}`, { method, headers, body });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || `${method} ${path} failed (${res.status})`);
  }
  return json;
}

function setSupabaseSecrets(projectRef, pairs) {
  const args = ["supabase", "secrets", "set", ...pairs, "--project-ref", projectRef];
  const result = spawnSync("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error(`secrets set failed for ${projectRef}`);
}

async function resolvePrices(secretKey) {
  const prices = await stripeApi(secretKey, "GET", "/prices?limit=100&expand[]=data.product");
  const pro = prices.data?.find(
    (p) => p.active !== false && p.recurring && p.unit_amount === 499,
  );
  const flexS = prices.data?.find(
    (p) => p.active !== false && !p.recurring && p.unit_amount === 249,
  );
  const flexM = prices.data?.find(
    (p) => p.active !== false && !p.recurring && p.unit_amount === 399,
  );
  if (!pro?.id || !flexS?.id || !flexM?.id) {
    throw new Error(
      `Missing v1 prices (need 499/mo, 249, 399). Found pro=${pro?.id} s=${flexS?.id} m=${flexM?.id}`,
    );
  }
  return { pro: pro.id, flexS: flexS.id, flexM: flexM.id };
}

async function ensureTestPrices(secretKey) {
  try {
    return await resolvePrices(secretKey);
  } catch {
    console.log("  creating missing test-mode v1 products/prices…");
    const proProduct = await stripeApi(secretKey, "POST", "/products", { name: "Holzen Pro" });
    const flexSProduct = await stripeApi(secretKey, "POST", "/products", { name: "Holzen Flex Pack S" });
    const flexMProduct = await stripeApi(secretKey, "POST", "/products", { name: "Holzen Flex Pack M" });
    await stripeApi(secretKey, "POST", "/prices", {
      product: proProduct.id,
      unit_amount: "499",
      currency: "usd",
      "recurring[interval]": "month",
    });
    await stripeApi(secretKey, "POST", "/prices", {
      product: flexSProduct.id,
      unit_amount: "249",
      currency: "usd",
    });
    await stripeApi(secretKey, "POST", "/prices", {
      product: flexMProduct.id,
      unit_amount: "399",
      currency: "usd",
    });
    return resolvePrices(secretKey);
  }
}

async function ensureWebhook(secretKey, url) {
  const listed = await stripeApi(secretKey, "GET", "/webhook_endpoints?limit=100");
  const hit = listed.data?.find((w) => w.url === url && w.status !== "disabled");
  if (hit) {
    console.log(`  webhook exists: ${hit.id} — rolling signing secret`);
    const rolled = await stripeApi(secretKey, "POST", `/webhook_endpoints/${hit.id}/secret`);
    return rolled.secret;
  }

  const form = { url };
  EVENTS.forEach((ev, i) => {
    form[`enabled_events[${i}]`] = ev;
  });
  const created = await stripeApi(secretKey, "POST", "/webhook_endpoints", form);
  console.log(`  webhook created: ${created.id}`);
  return created.secret;
}

async function bootstrapMode({ label, secretKey, projectRef, webhookUrl }) {
  if (!secretKey) throw new Error(`No secret key for ${label}`);
  console.log(`\n=== ${label} ===`);

  const priceIds = secretKey.startsWith("sk_test_")
    ? await ensureTestPrices(secretKey)
    : await resolvePrices(secretKey);
  console.log(`  STRIPE_PRICE_ID_PRO=${priceIds.pro}`);
  console.log(`  STRIPE_PRICE_ID_FLEX_PACK_S=${priceIds.flexS}`);
  console.log(`  STRIPE_PRICE_ID_FLEX_PACK_M=${priceIds.flexM}`);

  const webhookSecret = await ensureWebhook(secretKey, webhookUrl);

  setSupabaseSecrets(projectRef, [
    `STRIPE_SECRET_KEY=${secretKey}`,
    `STRIPE_WEBHOOK_SECRET=${webhookSecret}`,
    `STRIPE_PRICE_ID_PRO=${priceIds.pro}`,
    `STRIPE_PRICE_ID_FLEX_PACK_S=${priceIds.flexS}`,
    `STRIPE_PRICE_ID_FLEX_PACK_M=${priceIds.flexM}`,
  ]);
}

const keys = resolveKeys();
if (!keys.test) {
  console.error(`
Stripe test key not found. Run: npm run stripe:login
Or set STRIPE_TEST_SECRET_KEY in .env.stripe.bootstrap
`);
  process.exit(1);
}

try {
  await bootstrapMode({
    label: "TEST (staging)",
    secretKey: keys.test,
    projectRef: STAGING_REF,
    webhookUrl: STAGING_WEBHOOK,
  });
  if (!keys.live || keys.live.includes("*")) {
    console.log(`
=== LIVE (prod) — skipped ===
Stripe CLI stores a restricted live key (masked). Add your full secret key once:

  1. Stripe Dashboard → Developers → API keys → Reveal live key
  2. Copy .env.stripe.bootstrap.example → .env.stripe.bootstrap
  3. Set STRIPE_LIVE_SECRET_KEY=sk_live_...
  4. Re-run: npm run stripe:bootstrap-secrets
`);
    process.exit(0);
  }
  await bootstrapMode({
    label: "LIVE (prod)",
    secretKey: keys.live,
    projectRef: PROD_REF,
    webhookUrl: PROD_WEBHOOK,
  });
  console.log("\nDone. Stripe secrets pushed to staging + prod.");
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
