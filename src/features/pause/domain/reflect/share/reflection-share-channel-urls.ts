/** External share deep links for reflection copy (pure — no DOM). */
export function buildReflectionShareTweetUrl(text: string): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function buildReflectionShareWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildReflectionShareTelegramUrl(text: string, siteOrigin: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(siteOrigin)}&text=${encodeURIComponent(text)}`;
}
