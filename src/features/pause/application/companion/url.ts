export function hostnameFromUrl(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
