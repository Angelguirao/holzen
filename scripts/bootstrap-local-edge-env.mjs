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
const repoEnvPath = join(root, ".env");
const repoEnvLocalPath = join(root, ".env.local");
const sharedSupabaseEnvPath = join(root, "supabase", ".env");

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

function firstNonEmpty(...values) {
  for (const value of values) {
    const trimmed = value?.trim?.();
    if (trimmed) return trimmed;
  }
  return "";
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
  const repoEnv = readOptionalDotenv(repoEnvPath);
  const repoEnvLocal = readOptionalDotenv(repoEnvLocalPath);
  const sharedSupabaseEnv = readOptionalDotenv(sharedSupabaseEnvPath);
  const googleKey =
    firstNonEmpty(
      existing.GOOGLE_AI_API_KEY,
      sharedSupabaseEnv.GOOGLE_AI_API_KEY,
      repoEnvLocal.GOOGLE_AI_API_KEY,
      repoEnv.GOOGLE_AI_API_KEY,
      mcpSecrets.GOOGLE_AI_API_KEY,
      mcpSecrets.GEMINI_API_KEY,
      process.env.GOOGLE_AI_API_KEY,
      process.env.GEMINI_API_KEY,
    );
  const resendKey = firstNonEmpty(
    existing.RESEND_API_KEY,
    sharedSupabaseEnv.RESEND_API_KEY,
    repoEnvLocal.RESEND_API_KEY,
    repoEnv.RESEND_API_KEY,
    process.env.RESEND_API_KEY,
  );
  const openRouterKey = firstNonEmpty(
    existing.OPENROUTER_API_KEY,
    sharedSupabaseEnv.OPENROUTER_API_KEY,
    repoEnvLocal.OPENROUTER_API_KEY,
    repoEnv.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY,
  );
  const perplexityKey = firstNonEmpty(
    existing.PERPLEXITY_API_KEY,
    sharedSupabaseEnv.PERPLEXITY_API_KEY,
    repoEnvLocal.PERPLEXITY_API_KEY,
    repoEnv.PERPLEXITY_API_KEY,
    process.env.PERPLEXITY_API_KEY,
  );
  const stripeSecretKey =
    firstNonEmpty(
      existing.STRIPE_SECRET_KEY,
      sharedSupabaseEnv.STRIPE_SECRET_KEY,
      repoEnvLocal.STRIPE_SECRET_KEY,
      repoEnv.STRIPE_SECRET_KEY,
      process.env.STRIPE_SECRET_KEY,
      readStripeTestKeyFromCli(),
    );
  const stripeWebhookSecret =
    firstNonEmpty(
      flags["stripe-webhook-secret"],
      existing.STRIPE_WEBHOOK_SECRET,
      sharedSupabaseEnv.STRIPE_WEBHOOK_SECRET,
      repoEnvLocal.STRIPE_WEBHOOK_SECRET,
      repoEnv.STRIPE_WEBHOOK_SECRET,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

  return {
    EMAIL_BRAND_NAME: firstNonEmpty(existing.EMAIL_BRAND_NAME, sharedSupabaseEnv.EMAIL_BRAND_NAME) || "Holzen Local",
    EMAIL_APP_URL: firstNonEmpty(existing.EMAIL_APP_URL, sharedSupabaseEnv.EMAIL_APP_URL) || "http://localhost:8080",
    EMAIL_FROM_DOMAIN: firstNonEmpty(existing.EMAIL_FROM_DOMAIN, sharedSupabaseEnv.EMAIL_FROM_DOMAIN) || "resend.dev",
    EMAIL_FROM_LOCAL: firstNonEmpty(existing.EMAIL_FROM_LOCAL, sharedSupabaseEnv.EMAIL_FROM_LOCAL) || "onboarding",
    EMAIL_NOTIFY_LOCAL: firstNonEmpty(existing.EMAIL_NOTIFY_LOCAL, sharedSupabaseEnv.EMAIL_NOTIFY_LOCAL) || "onboarding",
    EMAIL_SENDER_DOMAIN: firstNonEmpty(existing.EMAIL_SENDER_DOMAIN, sharedSupabaseEnv.EMAIL_SENDER_DOMAIN) || "resend.dev",
    EMAIL_SUBJECT_PREFIX: firstNonEmpty(existing.EMAIL_SUBJECT_PREFIX, sharedSupabaseEnv.EMAIL_SUBJECT_PREFIX) || "[LOCAL]",
    CRON_SECRET: firstNonEmpty(existing.CRON_SECRET, sharedSupabaseEnv.CRON_SECRET) || generateSecret(),
    EMAIL_PREVIEW_SECRET: firstNonEmpty(existing.EMAIL_PREVIEW_SECRET, sharedSupabaseEnv.EMAIL_PREVIEW_SECRET) || generateSecret(),
    SEND_EMAIL_HOOK_SECRET: firstNonEmpty(existing.SEND_EMAIL_HOOK_SECRET, sharedSupabaseEnv.SEND_EMAIL_HOOK_SECRET) || generateSecret(),
    STRIPE_SECRET_KEY: stripeSecretKey,
    STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
    STRIPE_PRICE_ID_PRO: firstNonEmpty(existing.STRIPE_PRICE_ID_PRO, sharedSupabaseEnv.STRIPE_PRICE_ID_PRO) || stripePriceIds.pro,
    STRIPE_PRICE_ID_FLEX_PACK_S:
      firstNonEmpty(existing.STRIPE_PRICE_ID_FLEX_PACK_S, sharedSupabaseEnv.STRIPE_PRICE_ID_FLEX_PACK_S) || stripePriceIds.flexS,
    STRIPE_PRICE_ID_FLEX_PACK_M:
      firstNonEmpty(existing.STRIPE_PRICE_ID_FLEX_PACK_M, sharedSupabaseEnv.STRIPE_PRICE_ID_FLEX_PACK_M) || stripePriceIds.flexM,
    RESEND_API_KEY: resendKey,
    RESEND_WEBHOOK_SECRET: firstNonEmpty(
      existing.RESEND_WEBHOOK_SECRET,
      sharedSupabaseEnv.RESEND_WEBHOOK_SECRET,
      repoEnvLocal.RESEND_WEBHOOK_SECRET,
      repoEnv.RESEND_WEBHOOK_SECRET,
      process.env.RESEND_WEBHOOK_SECRET,
    ),
    GOOGLE_AI_API_KEY: googleKey,
    OPENROUTER_API_KEY: openRouterKey,
    OPENROUTER_HTTP_REFERER: firstNonEmpty(
      existing.OPENROUTER_HTTP_REFERER,
      sharedSupabaseEnv.OPENROUTER_HTTP_REFERER,
    ) || "http://localhost:8080",
    OPENROUTER_APP_TITLE: firstNonEmpty(
      existing.OPENROUTER_APP_TITLE,
      sharedSupabaseEnv.OPENROUTER_APP_TITLE,
    ) || "Holzen Local",
    PERPLEXITY_API_KEY: perplexityKey,
    COMPANION_PHASE_CATALOG: firstNonEmpty(
      existing.COMPANION_PHASE_CATALOG,
      sharedSupabaseEnv.COMPANION_PHASE_CATALOG,
      repoEnvLocal.COMPANION_PHASE_CATALOG,
      repoEnv.COMPANION_PHASE_CATALOG,
      process.env.COMPANION_PHASE_CATALOG,
    ) || "1",
    COMPANION_PHASE_CACHE: firstNonEmpty(
      existing.COMPANION_PHASE_CACHE,
      sharedSupabaseEnv.COMPANION_PHASE_CACHE,
      repoEnvLocal.COMPANION_PHASE_CACHE,
      repoEnv.COMPANION_PHASE_CACHE,
      process.env.COMPANION_PHASE_CACHE,
    ) || "1",
    COMPANION_PHASE_LIVE: firstNonEmpty(
      existing.COMPANION_PHASE_LIVE,
      sharedSupabaseEnv.COMPANION_PHASE_LIVE,
      repoEnvLocal.COMPANION_PHASE_LIVE,
      repoEnv.COMPANION_PHASE_LIVE,
      process.env.COMPANION_PHASE_LIVE,
    ) || "1",
    DISABLE_COMPANION_FALLBACKS: firstNonEmpty(
      existing.DISABLE_COMPANION_FALLBACKS,
      sharedSupabaseEnv.DISABLE_COMPANION_FALLBACKS,
      repoEnvLocal.DISABLE_COMPANION_FALLBACKS,
      repoEnv.DISABLE_COMPANION_FALLBACKS,
      process.env.DISABLE_COMPANION_FALLBACKS,
    ) || "1",
    FETCH_FEEDS_MAX_SOURCES: firstNonEmpty(
      existing.FETCH_FEEDS_MAX_SOURCES,
      sharedSupabaseEnv.FETCH_FEEDS_MAX_SOURCES,
      repoEnvLocal.FETCH_FEEDS_MAX_SOURCES,
      repoEnv.FETCH_FEEDS_MAX_SOURCES,
      process.env.FETCH_FEEDS_MAX_SOURCES,
    ) || "5",
    FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE: firstNonEmpty(
      existing.FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE,
      sharedSupabaseEnv.FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE,
      repoEnvLocal.FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE,
      repoEnv.FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE,
      process.env.FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE,
    ) || "100",
    FETCH_FEEDS_ARTICLE_DELAY_MS: firstNonEmpty(
      existing.FETCH_FEEDS_ARTICLE_DELAY_MS,
      sharedSupabaseEnv.FETCH_FEEDS_ARTICLE_DELAY_MS,
      repoEnvLocal.FETCH_FEEDS_ARTICLE_DELAY_MS,
      repoEnv.FETCH_FEEDS_ARTICLE_DELAY_MS,
      process.env.FETCH_FEEDS_ARTICLE_DELAY_MS,
    ) || "0",
    FETCH_FEEDS_LOG_ORIGINAL_INFER: firstNonEmpty(
      existing.FETCH_FEEDS_LOG_ORIGINAL_INFER,
      sharedSupabaseEnv.FETCH_FEEDS_LOG_ORIGINAL_INFER,
      repoEnvLocal.FETCH_FEEDS_LOG_ORIGINAL_INFER,
      repoEnv.FETCH_FEEDS_LOG_ORIGINAL_INFER,
      process.env.FETCH_FEEDS_LOG_ORIGINAL_INFER,
    ) || "false",
    COINGECKO_API_KEY: firstNonEmpty(
      existing.COINGECKO_API_KEY,
      sharedSupabaseEnv.COINGECKO_API_KEY,
      repoEnvLocal.COINGECKO_API_KEY,
      repoEnv.COINGECKO_API_KEY,
      process.env.COINGECKO_API_KEY,
    ),
    CRYPTOCOMPARE_API_KEY: firstNonEmpty(
      existing.CRYPTOCOMPARE_API_KEY,
      sharedSupabaseEnv.CRYPTOCOMPARE_API_KEY,
      repoEnvLocal.CRYPTOCOMPARE_API_KEY,
      repoEnv.CRYPTOCOMPARE_API_KEY,
      process.env.CRYPTOCOMPARE_API_KEY,
    ),
    VAPID_PUBLIC_KEY: firstNonEmpty(
      existing.VAPID_PUBLIC_KEY,
      sharedSupabaseEnv.VAPID_PUBLIC_KEY,
      repoEnvLocal.VAPID_PUBLIC_KEY,
      repoEnv.VAPID_PUBLIC_KEY,
      process.env.VAPID_PUBLIC_KEY,
    ),
    VAPID_PRIVATE_KEY: firstNonEmpty(
      existing.VAPID_PRIVATE_KEY,
      sharedSupabaseEnv.VAPID_PRIVATE_KEY,
      repoEnvLocal.VAPID_PRIVATE_KEY,
      repoEnv.VAPID_PRIVATE_KEY,
      process.env.VAPID_PRIVATE_KEY,
    ),
    SLACK_WEBHOOK_URL: firstNonEmpty(
      existing.SLACK_WEBHOOK_URL,
      sharedSupabaseEnv.SLACK_WEBHOOK_URL,
      repoEnvLocal.SLACK_WEBHOOK_URL,
      repoEnv.SLACK_WEBHOOK_URL,
      process.env.SLACK_WEBHOOK_URL,
    ),
    SENTRY_DSN_EDGES: firstNonEmpty(
      existing.SENTRY_DSN_EDGES,
      sharedSupabaseEnv.SENTRY_DSN_EDGES,
      repoEnvLocal.SENTRY_DSN_EDGES,
      repoEnv.SENTRY_DSN_EDGES,
      process.env.SENTRY_DSN_EDGES,
    ),
    SENTRY_RELEASE: firstNonEmpty(
      existing.SENTRY_RELEASE,
      sharedSupabaseEnv.SENTRY_RELEASE,
      repoEnvLocal.SENTRY_RELEASE,
      repoEnv.SENTRY_RELEASE,
      process.env.SENTRY_RELEASE,
    ),
    SENTRY_ENVIRONMENT: firstNonEmpty(
      existing.SENTRY_ENVIRONMENT,
      sharedSupabaseEnv.SENTRY_ENVIRONMENT,
      repoEnvLocal.SENTRY_ENVIRONMENT,
      repoEnv.SENTRY_ENVIRONMENT,
      process.env.SENTRY_ENVIRONMENT,
    ) || "local",
    LOG_DRAIN_URL: firstNonEmpty(
      existing.LOG_DRAIN_URL,
      sharedSupabaseEnv.LOG_DRAIN_URL,
      repoEnvLocal.LOG_DRAIN_URL,
      repoEnv.LOG_DRAIN_URL,
      process.env.LOG_DRAIN_URL,
    ),
    LOG_DRAIN_TOKEN: firstNonEmpty(
      existing.LOG_DRAIN_TOKEN,
      sharedSupabaseEnv.LOG_DRAIN_TOKEN,
      repoEnvLocal.LOG_DRAIN_TOKEN,
      repoEnv.LOG_DRAIN_TOKEN,
      process.env.LOG_DRAIN_TOKEN,
    ),
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
    "# --- Companion / feed generation controls ---",
    "PERPLEXITY_API_KEY=" + values.PERPLEXITY_API_KEY,
    "COMPANION_PHASE_CATALOG=" + values.COMPANION_PHASE_CATALOG,
    "COMPANION_PHASE_CACHE=" + values.COMPANION_PHASE_CACHE,
    "COMPANION_PHASE_LIVE=" + values.COMPANION_PHASE_LIVE,
    "DISABLE_COMPANION_FALLBACKS=" + values.DISABLE_COMPANION_FALLBACKS,
    "FETCH_FEEDS_MAX_SOURCES=" + values.FETCH_FEEDS_MAX_SOURCES,
    "FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE=" + values.FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE,
    "FETCH_FEEDS_ARTICLE_DELAY_MS=" + values.FETCH_FEEDS_ARTICLE_DELAY_MS,
    "FETCH_FEEDS_LOG_ORIGINAL_INFER=" + values.FETCH_FEEDS_LOG_ORIGINAL_INFER,
    "",
    "# --- Optional push / market data / alerts ---",
    "COINGECKO_API_KEY=" + values.COINGECKO_API_KEY,
    "CRYPTOCOMPARE_API_KEY=" + values.CRYPTOCOMPARE_API_KEY,
    "VAPID_PUBLIC_KEY=" + values.VAPID_PUBLIC_KEY,
    "VAPID_PRIVATE_KEY=" + values.VAPID_PRIVATE_KEY,
    "SLACK_WEBHOOK_URL=" + values.SLACK_WEBHOOK_URL,
    "",
    "# --- Optional observability ---",
    "SENTRY_DSN_EDGES=" + values.SENTRY_DSN_EDGES,
    "SENTRY_RELEASE=" + values.SENTRY_RELEASE,
    "SENTRY_ENVIRONMENT=" + values.SENTRY_ENVIRONMENT,
    "LOG_DRAIN_URL=" + values.LOG_DRAIN_URL,
    "LOG_DRAIN_TOKEN=" + values.LOG_DRAIN_TOKEN,
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
  const hasPerplexity = Boolean(values.PERPLEXITY_API_KEY);

  console.log("Local edge env bootstrapped:");
  console.log(`- Stripe local billing: ${hasStripe ? "ready" : "incomplete"}`);
  console.log(`- Email sending: ${hasEmailSending ? "ready" : "incomplete"}`);
  console.log(`- Email suppression webhook: ${hasEmailWebhook ? "ready" : "optional / missing"}`);
  console.log(`- Gemini/OpenRouter flows: ${hasAi ? "ready" : "incomplete"}`);
  console.log(`- Perplexity-backed companion/feed flows: ${hasPerplexity ? "ready" : "incomplete"}`);

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
  if (!values.PERPLEXITY_API_KEY) missing.push("PERPLEXITY_API_KEY");

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
