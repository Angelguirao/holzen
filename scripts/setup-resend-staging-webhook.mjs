/**
 * Ensure staging suppression webhook exists in Resend; write RESEND_* into .env.staging.secrets.
 * Usage: RESEND_API_KEY=re_... node scripts/setup-resend-staging-webhook.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDotenv } from "./parse-dotenv.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const secretsPath = join(root, ".env.staging.secrets");
const STAGING_WEBHOOK_URL =
  "https://ksplyxxdvandkwzundql.supabase.co/functions/v1/handle-email-suppression";
const WEBHOOK_EVENTS = ["email.bounced", "email.complained"];

const apiKey = process.env.RESEND_API_KEY?.trim();
if (!apiKey?.startsWith("re_")) {
  console.error("Set RESEND_API_KEY=re_... in the environment.");
  process.exit(1);
}

async function resend(path, init = {}) {
  const res = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`Resend ${init.method ?? "GET"} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return body;
}

function upsertEnvLine(content, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, line);
  return content.replace(
    /^(# --- Email \(auth \+ transactional\) ---\r?\n)/m,
    `$1${line}\n`,
  );
}

function setSecret(key, value) {
  let content = existsSync(secretsPath)
    ? readFileSync(secretsPath, "utf8")
    : readFileSync(join(root, ".env.staging.secrets.example"), "utf8");
  content = upsertEnvLine(content, key, value);
  writeFileSync(secretsPath, content, "utf8");
}

async function main() {
  setSecret("RESEND_API_KEY", apiKey);
  console.log("Updated RESEND_API_KEY in .env.staging.secrets");

  const domains = await resend("/domains").catch((err) => {
    if (String(err.message).includes("restricted_api_key")) {
      console.warn("API key is send-only — skipping domain/webhook API (use full_access key or Resend dashboard).");
      return null;
    }
    throw err;
  });
  if (domains) {
    const domainList = domains.data ?? [];
    console.log(
      `Resend domains: ${domainList.length ? domainList.map((d) => `${d.name} (${d.status})`).join(", ") : "none"}`,
    );
  }

  let listed;
  try {
    listed = await resend("/webhooks");
  } catch (err) {
    if (String(err.message).includes("restricted_api_key")) {
      listed = null;
    } else {
      throw err;
    }
  }

  if (!listed) {
    console.warn("Could not manage webhooks with this key.");
  } else {
  const existing = (listed.data ?? []).find((w) => w.endpoint === STAGING_WEBHOOK_URL);

  let webhookId;
  let signingSecret;

  if (existing) {
    webhookId = existing.id;
    console.log(`Webhook already exists for staging suppression (${webhookId})`);
    const detail = await resend(`/webhooks/${webhookId}`);
    signingSecret = detail.signing_secret ?? detail.data?.signing_secret;
  } else {
    const created = await resend("/webhooks", {
      method: "POST",
      body: JSON.stringify({ endpoint: STAGING_WEBHOOK_URL, events: WEBHOOK_EVENTS }),
    });
    webhookId = created.id ?? created.data?.id;
    signingSecret = created.signing_secret ?? created.data?.signing_secret;
    console.log(`Created staging webhook ${webhookId}`);
  }

  if (!signingSecret) {
    console.warn(
      "Could not read signing_secret from API — set RESEND_WEBHOOK_SECRET manually from Resend dashboard.",
    );
  } else {
    setSecret("RESEND_WEBHOOK_SECRET", signingSecret);
    console.log("Updated RESEND_WEBHOOK_SECRET in .env.staging.secrets");
  }
  }

  const parsed = parseDotenv(readFileSync(secretsPath, "utf8"));
  if (!parsed.SEND_EMAIL_HOOK_SECRET?.trim()) {
    console.warn(
      "SEND_EMAIL_HOOK_SECRET still empty — set in Supabase Auth → Hooks → Send Email, then re-run staging:secrets-set.",
    );
  }

  console.log("Done. Run: npm run staging:secrets-set");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
