/**
 * Source attribution validation for signal companion content.
 *
 * Ensures the AI attributes insights to the correct author by:
 * 1. Cross-referencing against known sources from the signal_sources catalog
 * 2. Extracting author info from citation URLs
 * 3. Providing a correction when the AI's attribution doesn't match
 */

// ── Well-known Bitcoin author → domain mapping ──
// Used when the signal_sources table isn't available or for fast lookup
const KNOWN_AUTHORS: Record<string, string[]> = {
  "Gigi": ["21lessons.com", "dergigi.com"],
  "Saifedean Ammous": ["saifedean.com"],
  "Parker Lewis": ["unchained.com", "unchained-capital.com"],
  "Allen Farrington": ["allenfarrington.medium.com"],
  "Vijay Boyapati": ["vijayboyapati.medium.com"],
  "Robert Breedlove": ["breedlove22.medium.com", "whatismoneypodcast.com"],
  "Jeff Booth": ["jeffbooth.ca"],
  "Lyn Alden": ["lynalden.com"],
  "Knut Svanholm": ["knutsvanholm.com"],
  "Nick Szabo": ["nakamotoinstitute.org", "unenumerated.blogspot.com"],
  "Hal Finney": ["nakamotoinstitute.org"],
  "Adam Back": ["blockstream.com"],
  "Eric Cason": ["cryptosovereignty.org"],
  "Hugo Nguyen": ["hugonguyen.medium.com"],
  "Hasu": ["uncommoncore.co", "insights.deribit.com"],
  "Tuur Demeester": ["adamant.io"],
  "Michael Saylor": ["microstrategy.com", "saylor.org"],
  "Cypherpunk Manifesto": ["activism.net"],
  "Murray Rothbard": ["mises.org"],
  "Ludwig von Mises": ["mises.org"],
  "Friedrich Hayek": ["mises.org"],
  "Bitcoin Magazine": ["bitcoinmagazine.com"],
  "Nakamoto Institute": ["nakamotoinstitute.org"],
};

// Build a reverse lookup: domain → author
const DOMAIN_TO_AUTHOR = new Map<string, string>();
for (const [author, domains] of Object.entries(KNOWN_AUTHORS)) {
  for (const domain of domains) {
    DOMAIN_TO_AUTHOR.set(domain, author);
  }
}

/**
 * Extract the likely author from a citation URL using known mappings.
 * Returns the author name if found, or null.
 */
export function authorFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
    // Exact domain match
    const exact = DOMAIN_TO_AUTHOR.get(hostname);
    if (exact) return exact;
    // Partial match (e.g., "blog.allenfarrington.com" contains "allenfarrington")
    for (const [domain, author] of DOMAIN_TO_AUTHOR.entries()) {
      if (hostname.includes(domain.split(".")[0])) return author;
    }
  } catch { /* invalid URL */ }
  return null;
}

/**
 * Validate and potentially correct the source attribution.
 *
 * @param aiSource - The source name the AI generated
 * @param citationUrl - The URL the AI pinned to
 * @param citations - All available citation URLs
 * @param knownSources - Optional array from signal_sources table
 * @returns Corrected source name, or the original if no correction needed
 */
export function validateSource(
  aiSource: string,
  citationUrl: string,
  citations: string[],
  knownSources?: Array<{ name: string; url?: string | null }>,
): string {
  if (!aiSource) return aiSource;

  // 1. Check if AI source matches a known author exactly
  const aiSourceLower = aiSource.toLowerCase();
  for (const [author] of Object.entries(KNOWN_AUTHORS)) {
    if (aiSourceLower.includes(author.toLowerCase())) return aiSource; // Looks correct
  }

  // 2. Check against the signal_sources catalog
  if (knownSources) {
    for (const src of knownSources) {
      if (aiSourceLower.includes(src.name.toLowerCase())) return aiSource; // Matches catalog
    }
  }

  // 3. AI source doesn't match any known author — try to correct from URL
  const urlAuthor = authorFromUrl(citationUrl);
  if (urlAuthor) {
    return urlAuthor; // Override with URL-based author
  }

  // 4. Try each citation URL
  for (const c of citations) {
    const author = authorFromUrl(c);
    if (author) return author;
  }

  // 5. Can't determine — keep the AI's source but append the domain for transparency
  if (citationUrl) {
    try {
      const hostname = new URL(citationUrl.startsWith("http") ? citationUrl : `https://${citationUrl}`).hostname.replace(/^www\./, "");
      if (hostname && !aiSourceLower.includes(hostname.split(".")[0])) {
        return `${aiSource} (via ${hostname})`;
      }
    } catch { /* ignore */ }
  }

  return aiSource;
}
