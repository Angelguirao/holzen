/**
 * Input sanitization for user-controlled text that gets embedded in AI prompts.
 *
 * Prevents prompt injection by:
 * 1. Truncating to reasonable lengths
 * 2. Stripping control characters and escape sequences
 * 3. Removing obvious injection patterns
 *
 * This is defense-in-depth — structured output (JSON mode, tool calls)
 * already limits the impact of injection, but sanitization adds another layer.
 */

/** Strip control characters and zero-width chars */
function stripControl(s: string): string {
  // Remove ASCII control chars except newline/tab, and zero-width chars.
  // The control-character range is the whole point of this regex; silence the rule.
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\uFEFF]/g, "");
}

/** Remove obvious prompt injection patterns */
function stripInjection(s: string): string {
  // Remove lines that look like system/assistant role overrides
  return s
    .replace(/^(system|assistant|user)\s*:/gim, "")
    .replace(/ignore\s+(all\s+)?previous\s+instructions/gi, "")
    .replace(/forget\s+(all\s+)?previous/gi, "")
    .replace(/you\s+are\s+now\s+/gi, "")
    .replace(/new\s+instructions?\s*:/gi, "")
    .replace(/override\s*:/gi, "");
}

/**
 * Sanitize a user-provided text field before embedding in an AI prompt.
 *
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default: 500)
 * @returns Sanitized string, or empty string if input is null/undefined
 */
export function sanitizePromptInput(input: string | null | undefined, maxLength = 500): string {
  if (!input || typeof input !== "string") return "";
  let cleaned = input.trim();
  cleaned = stripControl(cleaned);
  cleaned = stripInjection(cleaned);
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength).trim();
  }
  return cleaned;
}

/**
 * Sanitize an array of user-provided strings (e.g., motivations, activities).
 *
 * @param items - Array of raw user inputs
 * @param maxItems - Maximum number of items (default: 10)
 * @param maxItemLength - Maximum length per item (default: 100)
 * @returns Sanitized array
 */
export function sanitizePromptArray(
  items: string[] | null | undefined,
  maxItems = 10,
  maxItemLength = 100,
): string[] {
  if (!items || !Array.isArray(items)) return [];
  return items
    .slice(0, maxItems)
    .map(item => sanitizePromptInput(item, maxItemLength))
    .filter(item => item.length > 0);
}
