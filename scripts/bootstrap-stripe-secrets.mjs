#!/usr/bin/env node
/**
 * Create Stripe webhooks, resolve v1 price IDs, push secrets to Supabase.
 *
 * Keys:
 * - Test: full sk_test_… from ~/.config/stripe/config.toml after `npm run stripe:login`
 * - Live checkout: rk_live_… from Stripe CLI Windows credential store (or sk_live_… in env)
 * - Live webhooks: require sk_live_… (STRIPE_LIVE_SECRET_KEY) — CLI rk_live cannot create webhooks
 *
 * Usage: npm run stripe:bootstrap-secrets
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir, platform } from "node:os";
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

function readWindowsStripeLiveKey() {
  if (platform() !== "win32") return null;
  const ps1 = join(process.cwd(), "scripts/read-stripe-cli-live-key.ps1");
  if (!existsSync(ps1)) return null;
  const result = spawnSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1],
    { encoding: "utf8" },
  );
  const key = result.stdout.trim();
  if (key.startsWith("rk_live_") || key.startsWith("sk_live_")) return key;
  return null;
}

function keysFromCli() {
  const configPath = join(homedir(), ".config/stripe/config.toml");
  if (!existsSync(configPath)) return null;

  const toml = readFileSync(configPath, "utf8");
  const test = toml.match(/test_mode_api_key\s*=\s*['"](sk_test_[^'"]+)['"]/)?.[1];
  let live = toml.match(/live_mode_api_key\s*=\s*['"]((?:sk_live|rk_live)_[^'"]+)['"]/)?.[1];
  if (!live || live.includes("*")) live = readWindowsStripeLiveKey();
  return { test, live };
}

function resolveKeys() {
  loadBootstrapEnv();
  const fromCli = keysFromCli();
  return {
    test: process.env.STRIPE_TEST_SECRET_KEY || fromCli?.test,
    liveCheckout: process.env.STRIPE_LIVE_SECRET_KEY || fromCli?.live,
    liveAdmin: process.env.STRIPE_LIVE_SECRET_KEY || null,
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
  const pro = prices.data?.find((p) => p.active !== false && p.recurring && p.unit_amount === 499);
  const flexS = prices.data?.find((p) => p.active !== false && !p.recurring && p.unit_amount === 249);
  const flexM = prices.data?.find((p) => p.active !== false && !p.recurring && p.unit_amount === 399);
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
    const flexSProduct = await stripeApi(secretKey, "POST", "/products", {
      name: "Holzen Flex Pack S",
    });
    const flexMProduct = await stripeApi(secretKey, "POST", "/products", {
      name: "Holzen Flex Pack M",
    });
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

async function ensureWebhook(adminKey, url) {
  const listed = await stripeApi(adminKey, "GET", "/webhook_endpoints?limit=100");
  const hit = listed.data?.find((w) => w.url === url && w.status !== "disabled");
  if (hit) {
    console.log(`  webhook exists: ${hit.id} (keeping existing STRIPE_WEBHOOK_SECRET)`);
    return null;
  }

  const form = { url };
  EVENTS.forEach((ev, i) => {
    form[`enabled_events[${i}]`] = ev;
  });
  const created = await stripeApi(adminKey, "POST", "/webhook_endpoints", form);
  console.log(`  webhook created: ${created.id}`);
  return created.secret;
}

async function bootstrapMode({ label, checkoutKey, webhookAdminKey, projectRef, webhookUrl }) {
  if (!checkoutKey) throw new Error(`No checkout key for ${label}`);
  console.log(`\n=== ${label} ===`);

  const priceIds = checkoutKey.startsWith("sk_test_")
    ? await ensureTestPrices(checkoutKey)
    : await resolvePrices(checkoutKey);
  console.log(`  STRIPE_PRICE_ID_PRO=${priceIds.pro}`);
  console.log(`  STRIPE_PRICE_ID_FLEX_PACK_S=${priceIds.flexS}`);
  console.log(`  STRIPE_PRICE_ID_FLEX_PACK_M=${priceIds.flexM}`);

  const secrets = [
    `STRIPE_SECRET_KEY=${checkoutKey}`,
    `STRIPE_PRICE_ID_PRO=${priceIds.pro}`,
    `STRIPE_PRICE_ID_FLEX_PACK_S=${priceIds.flexS}`,
    `STRIPE_PRICE_ID_FLEX_PACK_M=${priceIds.flexM}`,
  ];

  const webhookKey = webhookAdminKey || checkoutKey;
  try {
    const webhookSecret = await ensureWebhook(webhookKey, webhookUrl);
    if (webhookSecret) secrets.push(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
  } catch (err) {
    if (label.includes("LIVE") && !webhookAdminKey) {
      console.log(`  webhook skipped: ${err instanceof Error ? err.message : err}`);
      console.log(
        "  checkout + prices pushed; add STRIPE_LIVE_SECRET_KEY=sk_live_… to .env.stripe.bootstrap and re-run for webhook",
      );
    } else {
      throw err;
    }
  }

  setSupabaseSecrets(projectRef, secrets);
}

const keys = resolveKeys();
if (!keys.test) {
  console.error("Stripe test key not found. Run: npm run stripe:login");
  process.exit(1);
}

try {
  await bootstrapMode({
    label: "TEST (staging)",
    checkoutKey: keys.test,
    webhookAdminKey: keys.test,
    projectRef: STAGING_REF,
    webhookUrl: STAGING_WEBHOOK,
  });

  if (!keys.liveCheckout) {
    console.log("\nLive key not found. Run: npm run stripe:login");
    process.exit(0);
  }

  await bootstrapMode({
    label: "LIVE (prod)",
    checkoutKey: keys.liveCheckout,
    webhookAdminKey: keys.liveAdmin,
    projectRef: PROD_REF,
    webhookUrl: PROD_WEBHOOK,
  });

  console.log("\nDone. Stripe secrets pushed to staging + prod.");
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
