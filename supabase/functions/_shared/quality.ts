/**
 * Shared quality gate logic for AI-generated companion content.
 * Centralises slop detection, schema validation, and length checks.
 */

// ── Banned AI-slop phrases ──
// If any of these appear in generated text, it fails the quality gate.
export const BANNED_PHRASES = [
  "dive into", "game-changer", "paradigm shift", "revolutionary", "unprecedented",
  "navigate the", "in the world of", "it's worth noting", "at the end of the day",
  "moving forward", "leverage", "synergy", "ecosystem", "disruptive", "next-gen",
  "cutting-edge", "in today's", "it is important to", "crucial to understand",
  "let's explore", "without a doubt", "it goes without saying", "needless to say",
  "in conclusion", "at its core", "when it comes to", "in this article",
];

/** Check if text contains any banned slop phrases */
export function containsSlop(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BANNED_PHRASES.some(p => lower.includes(p));
}

// ── Per-companion-type quality gate configurations ──

interface QualityConfig {
  minBodyLength: number;
  maxBodyLength: number;
  minTitleWords: number;
  maxTitleWords: number;
  bodyField: string;       // Which field contains the main body text
  requiredFields: string[];
  noMarketData: boolean;   // Reject if body contains percentages or dollar amounts
}

const QUALITY_CONFIGS: Record<string, QualityConfig> = {
  signal: {
    minBodyLength: 80,
    maxBodyLength: 600,
    minTitleWords: 1,
    maxTitleWords: 14,
    bodyField: "body",
    requiredFields: ["title", "body", "source"],
    noMarketData: true,
  },
  ground_nudge: {
    minBodyLength: 80,
    maxBodyLength: 800,
    minTitleWords: 1,
    maxTitleWords: 15,
    bodyField: "body",
    requiredFields: ["title", "body"],
    noMarketData: false,
  },
  historical_insight: {
    minBodyLength: 80,
    maxBodyLength: 800,
    minTitleWords: 1,
    maxTitleWords: 15,
    bodyField: "btcInsight",
    requiredFields: ["title", "btcInsight"],
    noMarketData: false,
  },
  zoom_out_deep_time: {
    minBodyLength: 80,
    maxBodyLength: 500,
    minTitleWords: 3,
    maxTitleWords: 10,
    bodyField: "body",
    requiredFields: ["title", "body"],
    noMarketData: true,
  },
};

/**
 * Run the quality gate for a specific companion type.
 * Returns { pass: true } or { pass: false, reason: string }.
 */
export function qualityGate(
  companionType: string,
  content: any,
): { pass: boolean; reason?: string } {
  if (!content || typeof content !== "object") {
    return { pass: false, reason: "null_or_invalid" };
  }

  const config = QUALITY_CONFIGS[companionType];
  if (!config) {
    // Unknown companion type — apply minimal validation
    return content.title || content.body
      ? { pass: true }
      : { pass: false, reason: "no_title_or_body" };
  }

  // Required fields check
  for (const field of config.requiredFields) {
    if (typeof content[field] !== "string" || content[field].trim().length < 2) {
      return { pass: false, reason: `missing_${field}` };
    }
  }

  // Title validation
  const title = content.title?.trim() || "";
  if (title.length < 5) return { pass: false, reason: "title_too_short" };
  const titleWords = title.split(/\s+/).length;
  if (titleWords < config.minTitleWords) return { pass: false, reason: "title_too_few_words" };
  if (titleWords > config.maxTitleWords) return { pass: false, reason: "title_too_many_words" };

  // Body validation
  const body = content[config.bodyField]?.trim() || "";
  if (body.length < config.minBodyLength) return { pass: false, reason: "body_too_short" };
  if (body.length > config.maxBodyLength) return { pass: false, reason: "body_too_long" };

  // Slop check
  if (containsSlop(body)) return { pass: false, reason: "body_contains_slop" };
  if (containsSlop(title)) return { pass: false, reason: "title_contains_slop" };

  // Market data check (for philosophy/deep-time content)
  if (config.noMarketData && /\d{2,}%|\$\d/.test(body)) {
    return { pass: false, reason: "body_contains_market_data" };
  }

  return { pass: true };
}

// ── URL validation ──

/** Check if a URL string is syntactically valid */
export function isValidUrl(s: string): boolean {
  if (!s || s === "N/A" || s.length < 10) return false;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Normalize a URL to always have a protocol prefix */
export function normalizeUrl(s: string): string {
  if (!s) return "";
  if (!s.startsWith("http")) return `https://${s}`;
  return s;
}

/** Check if a URL is reachable via HEAD request (4s timeout) */
export async function isUrlReachable(url: string): Promise<boolean> {
  if (!url || url.length < 10) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    clearTimeout(timeout);
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

// ── Content fingerprinting ──

/**
 * Generate a content fingerprint using SHA-256 hash.
 * Used for dedup in companion_cache. Deterministic for the same input.
 *
 * @param content - The text to fingerprint (typically normalized title + body prefix)
 * @returns 32-char hex string (first 128 bits of SHA-256)
 */
export async function contentFingerprint(content: string): Promise<string> {
  const data = new TextEncoder().encode(content);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes.slice(0, 16))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Synchronous fingerprint fallback using simple string hash.
 * Use contentFingerprint (async) when possible; this is for contexts
 * where async isn't convenient.
 */
export function contentFingerprintSync(content: string): string {
  // djb2 hash → hex, 32 chars
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash + content.charCodeAt(i)) >>> 0;
  }
  // Repeat to fill 32 chars
  const h1 = hash.toString(16).padStart(8, "0");
  let hash2 = 2166136261;
  for (let i = 0; i < content.length; i++) {
    hash2 = ((hash2 ^ content.charCodeAt(i)) * 16777619) >>> 0;
  }
  const h2 = hash2.toString(16).padStart(8, "0");
  let hash3 = 0;
  for (let i = 0; i < content.length; i++) {
    hash3 = content.charCodeAt(i) + ((hash3 << 6) + (hash3 << 16) - hash3);
    hash3 = hash3 >>> 0;
  }
  const h3 = hash3.toString(16).padStart(8, "0");
  let hash4 = 0x811c9dc5;
  for (let i = content.length - 1; i >= 0; i--) {
    hash4 = ((hash4 ^ content.charCodeAt(i)) * 0x01000193) >>> 0;
  }
  const h4 = hash4.toString(16).padStart(8, "0");
  return (h1 + h2 + h3 + h4).slice(0, 32);
}

// ── Title-based dedup helper ──

/** Normalize a title for dedup comparison */
export function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

/**
 * Check if a similar title already exists in the cache for a companion type.
 * Uses exact match, substring containment, and word overlap.
 */
export async function isDuplicateTitle(
  svcClient: any,
  companionType: string,
  newTitle: string,
  language = "en",
): Promise<boolean> {
  if (!newTitle || newTitle.length < 5) return false;

  const { data } = await svcClient
    .from("companion_cache")
    .select("content")
    .eq("companion_type", companionType)
    .eq("language", language)
    .limit(50);

  if (!data || data.length === 0) return false;

  const newNorm = normalizeTitle(newTitle);
  const newWords = new Set(newNorm.split(/\s+/).filter((w: string) => w.length > 3));

  for (const entry of data) {
    const existingTitle = (entry.content as any)?.title;
    if (!existingTitle) continue;
    const existNorm = normalizeTitle(existingTitle);

    // Exact match
    if (existNorm === newNorm) return true;

    // Substring containment
    if (existNorm.includes(newNorm) || newNorm.includes(existNorm)) return true;

    // Word overlap: >60% of significant words match
    const existWords = new Set(existNorm.split(/\s+/).filter((w: string) => w.length > 3));
    if (newWords.size === 0 || existWords.size === 0) continue;
    let overlap = 0;
    for (const w of newWords) { if (existWords.has(w)) overlap++; }
    const overlapRatio = overlap / Math.min(newWords.size, existWords.size);
    if (overlapRatio > 0.6) return true;
  }

  return false;
}
