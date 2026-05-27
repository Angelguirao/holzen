/**
 * Parse and serialize simple KEY=VALUE env files (no export keyword, # comments).
 */
import { readFileSync, existsSync } from "node:fs";

export function parseDotenv(content) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function readDotenvFile(filePath) {
  if (!existsSync(filePath)) return {};
  return parseDotenv(readFileSync(filePath, "utf8"));
}

/** First non-empty value for any of the keys, scanning maps in order. */
export function firstEnvValue(maps, keys) {
  for (const map of maps) {
    for (const key of keys) {
      const value = map[key]?.trim();
      if (value) return value;
    }
  }
  return "";
}

export function serializeMcpSecrets(env, headerLines = []) {
  const gemini = env.GEMINI_API_KEY?.trim();
  const lines = [
    ...headerLines,
    "",
    gemini ? `GEMINI_API_KEY=${gemini}` : "# GEMINI_API_KEY=  # optional — Cursor aistudio MCP only",
    `IONOS_API_KEY=${env.IONOS_API_KEY ?? ""}`,
    `IONOS_MCP_PATH=${env.IONOS_MCP_PATH ?? ""}`,
    "",
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
