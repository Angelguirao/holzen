#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { parseDotenv } from "./parse-dotenv.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const targetPath = join(root, "supabase", ".env.local");
const cliConfigPath = join(homedir(), ".config", "stripe", "config.toml");
const cursorMcpSecretsPath = join(root, ".cursor", "mcp-secrets.env");

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith("--")) continue;
    const key = current.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = "true";
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function readExistingEnv() {
  if (!existsSync(targetPath)) return {};
  return parseDotenv(readFileSync(targetPath, "utf8"));
}

function readOptionalDotenv(filePath) {
  if (!existsSync(filePath)) return {};
  return parseDotenv(readFileSync(filePath, "utf8"));
}

function readStripeTestKeyFromCli() {
  if (!existsSync(cliConfigPath)) return "";
  const toml = readFileSync(cliConfigPath, "utf8");
  return toml.match(/test_mode_api_key\s*=\s*['"](sk_test_[^'"]+)['"]/)?.[1]?.trim() ?? "";
}

async function stripeApi(secretKey, path) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error?.message || `Stripe API ${path} failed (${response.status})`);
  }
  return body;
}

async function resolveStripePriceIds(secretKey) {
  const prices = await stripeApi(secretKey, "/prices?limit=100&expand[]=data.product");
  const byAmount = (amount, recurring) =>
    prices.data?.find((price) => price.active !== false && Boolean(price.recurring) === recurring && price.unit_amount === amount);

  return {
    pro: byAmount(499, true)?.id ?? "",
    flexS: byAmount(249, false)?.id ?? "",
    flexM: byAmount(399, false)?.id ?? "",
  };
}

function generateSecret(bytes = 24) {
  return crypto.randomBytes(bytes).toString("hex");
}

function mergeValues(existing, flags, stripePriceIds) {
  const mcpSecrets = readOptionalDotenv(cursorMcpSecretsPath);
  const googleKey =
    existing.GOOGLE_AI_API_KEY?.trim() ||
    mcpSecrets.GOOGLE_AI_API_KEY?.trim() ||
    mcpSecrets.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    "";
  const resendKey = existing.RESEND_API_KEY?.trim() || process.env.RESEND_API_KEY?.trim() || "";
  const openRouterKey =
    existing.OPENROUTER_API_KEY?.trim() || process.env.OPENROUTER_API_KEY?.trim() || "";
  const stripeSecretKey =
    existing.STRIPE_SECRET_KEY?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim() ||
    readStripeTestKeyFromCli();
  const stripeWebhookSecret =
    flags["stripe-webhook-secret"]?.trim() ||
    existing.STRIPE_WEBHOOK_SECRET?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
    "";

  return {
    EMAIL_BRAND_NAME: existing.EMAIL_BRAND_NAME?.trim() || "Holzen Local",
    EMAIL_APP_URL: existing.EMAIL_APP_URL?.trim() || "http://localhost:8080",
    EMAIL_FROM_DOMAIN: existing.EMAIL_FROM_DOMAIN?.trim() || "resend.dev",
    EMAIL_FROM_LOCAL: existing.EMAIL_FROM_LOCAL?.trim() || "onboarding",
    EMAIL_NOTIFY_LOCAL: existing.EMAIL_NOTIFY_LOCAL?.trim() || "onboarding",
    EMAIL_SENDER_DOMAIN: existing.EMAIL_SENDER_DOMAIN?.trim() || "resend.dev",
    EMAIL_SUBJECT_PREFIX: existing.EMAIL_SUBJECT_PREFIX?.trim() || "[LOCAL]",
    CRON_SECRET: existing.CRON_SECRET?.trim() || generateSecret(),
    EMAIL_PREVIEW_SECRET: existing.EMAIL_PREVIEW_SECRET?.trim() || generateSecret(),
    SEND_EMAIL_HOOK_SECRET: existing.SEND_EMAIL_HOOK_SECRET?.trim() || generateSecret(),
    STRIPE_SECRET_KEY: stripeSecretKey,
    STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
    STRIPE_PRICE_ID_PRO: existing.STRIPE_PRICE_ID_PRO?.trim() || stripePriceIds.pro,
    STRIPE_PRICE_ID_FLEX_PACK_S: existing.STRIPE_PRICE_ID_FLEX_PACK_S?.trim() || stripePriceIds.flexS,
    STRIPE_PRICE_ID_FLEX_PACK_M: existing.STRIPE_PRICE_ID_FLEX_PACK_M?.trim() || stripePriceIds.flexM,
    RESEND_API_KEY: resendKey,
    RESEND_WEBHOOK_SECRET:
      existing.RESEND_WEBHOOK_SECRET?.trim() || process.env.RESEND_WEBHOOK_SECRET?.trim() || "",
    GOOGLE_AI_API_KEY: googleKey,
    OPENROUTER_API_KEY: openRouterKey,
    OPENROUTER_HTTP_REFERER:
      existing.OPENROUTER_HTTP_REFERER?.trim() || "http://localhost:8080",
    OPENROUTER_APP_TITLE: existing.OPENROUTER_APP_TITLE?.trim() || "Holzen Local",
    SENTRY_ENVIRONMENT: existing.SENTRY_ENVIRONMENT?.trim() || "local",
  };
}

function renderEnv(values) {
  const lines = [
    "# Personal local Edge Function secrets for `npm run supabase:functions:serve`.",
    "# This file is gitignored and overrides values from `supabase/.env`.",
    "",
    "# --- Local app / email branding ---",
    `EMAIL_BRAND_NAME=${values.EMAIL_BRAND_NAME}`,
    `EMAIL_APP_URL=${values.EMAIL_APP_URL}`,
    `EMAIL_FROM_DOMAIN=${values.EMAIL_FROM_DOMAIN}`,
    `EMAIL_FROM_LOCAL=${values.EMAIL_FROM_LOCAL}`,
    `EMAIL_NOTIFY_LOCAL=${values.EMAIL_NOTIFY_LOCAL}`,
    `EMAIL_SENDER_DOMAIN=${values.EMAIL_SENDER_DOMAIN}`,
    `EMAIL_SUBJECT_PREFIX=${values.EMAIL_SUBJECT_PREFIX}`,
    "",
    "# --- Local cron / ops auth ---",
    "CRON_SECRET=" + values.CRON_SECRET,
    "EMAIL_PREVIEW_SECRET=" + values.EMAIL_PREVIEW_SECRET,
    "SEND_EMAIL_HOOK_SECRET=" + values.SEND_EMAIL_HOOK_SECRET,
    "",
    "# --- Stripe (test mode) ---",
    "STRIPE_SECRET_KEY=" + values.STRIPE_SECRET_KEY,
    "STRIPE_WEBHOOK_SECRET=" + values.STRIPE_WEBHOOK_SECRET,
    "STRIPE_PRICE_ID_PRO=" + values.STRIPE_PRICE_ID_PRO,
    "STRIPE_PRICE_ID_FLEX_PACK_S=" + values.STRIPE_PRICE_ID_FLEX_PACK_S,
    "STRIPE_PRICE_ID_FLEX_PACK_M=" + values.STRIPE_PRICE_ID_FLEX_PACK_M,
    "",
    "# --- Resend / auth email ---",
    "RESEND_API_KEY=" + values.RESEND_API_KEY,
    "RESEND_WEBHOOK_SECRET=" + values.RESEND_WEBHOOK_SECRET,
    "",
    "# --- AI providers ---",
    "GOOGLE_AI_API_KEY=" + values.GOOGLE_AI_API_KEY,
    "OPENROUTER_API_KEY=" + values.OPENROUTER_API_KEY,
    "OPENROUTER_HTTP_REFERER=" + values.OPENROUTER_HTTP_REFERER,
    "OPENROUTER_APP_TITLE=" + values.OPENROUTER_APP_TITLE,
    "",
    "# --- Optional observability ---",
    "SENTRY_ENVIRONMENT=" + values.SENTRY_ENVIRONMENT,
    "",
  ];

  return lines.join("\n");
}

function summarize(values) {
  const hasStripe = Boolean(
    values.STRIPE_SECRET_KEY &&
      values.STRIPE_WEBHOOK_SECRET &&
      values.STRIPE_PRICE_ID_PRO &&
      values.STRIPE_PRICE_ID_FLEX_PACK_S &&
      values.STRIPE_PRICE_ID_FLEX_PACK_M,
  );
  const hasEmailSending = Boolean(values.RESEND_API_KEY);
  const hasEmailWebhook = Boolean(values.RESEND_WEBHOOK_SECRET);
  const hasAi = Boolean(values.GOOGLE_AI_API_KEY || values.OPENROUTER_API_KEY);

  console.log("Local edge env bootstrapped:");
  console.log(`- Stripe local billing: ${hasStripe ? "ready" : "incomplete"}`);
  console.log(`- Email sending: ${hasEmailSending ? "ready" : "incomplete"}`);
  console.log(`- Email suppression webhook: ${hasEmailWebhook ? "ready" : "optional / missing"}`);
  console.log(`- AI flows: ${hasAi ? "ready" : "incomplete"}`);

  const missing = [];
  if (!values.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
  if (!values.STRIPE_WEBHOOK_SECRET) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!values.STRIPE_PRICE_ID_PRO) missing.push("STRIPE_PRICE_ID_PRO");
  if (!values.STRIPE_PRICE_ID_FLEX_PACK_S) missing.push("STRIPE_PRICE_ID_FLEX_PACK_S");
  if (!values.STRIPE_PRICE_ID_FLEX_PACK_M) missing.push("STRIPE_PRICE_ID_FLEX_PACK_M");
  if (!values.RESEND_API_KEY) missing.push("RESEND_API_KEY");
  if (!values.GOOGLE_AI_API_KEY && !values.OPENROUTER_API_KEY) {
    missing.push("GOOGLE_AI_API_KEY or OPENROUTER_API_KEY");
  }

  if (missing.length > 0) {
    console.log("- Missing:");
    for (const item of missing) console.log(`  - ${item}`);
  }

  console.log("");
  console.log("Next:");
  console.log("1. Restart `npm run supabase:functions:serve` if it is already running.");
  console.log("2. Run `npm run supabase:cron:local` to refresh local cron auth/wiring.");
  console.log("3. Keep `stripe listen --forward-to http://127.0.0.1:55421/functions/v1/stripe-webhook` running for local billing webhooks.");
}

const flags = parseArgs(process.argv);
const existing = readExistingEnv();

let stripePriceIds = {
  pro: existing.STRIPE_PRICE_ID_PRO?.trim() || "",
  flexS: existing.STRIPE_PRICE_ID_FLEX_PACK_S?.trim() || "",
  flexM: existing.STRIPE_PRICE_ID_FLEX_PACK_M?.trim() || "",
};

const bootstrapStripeKey =
  existing.STRIPE_SECRET_KEY?.trim() ||
  process.env.STRIPE_SECRET_KEY?.trim() ||
  readStripeTestKeyFromCli();

if (bootstrapStripeKey) {
  try {
    stripePriceIds = await resolveStripePriceIds(bootstrapStripeKey);
  } catch (error) {
    console.warn(
      `Could not resolve local Stripe test prices automatically: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const values = mergeValues(existing, flags, stripePriceIds);

mkdirSync(dirname(targetPath), { recursive: true });
writeFileSync(targetPath, renderEnv(values), "utf8");
summarize(values);
