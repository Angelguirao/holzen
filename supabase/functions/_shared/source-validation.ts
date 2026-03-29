/**
 * Source attribution validation for signal companion content.
 *
 * Priority: citation URL → publication or known author domain → AI string (only if consistent).
 * Previously we trusted any "known author" substring in the AI output without checking the URL,
 * which let the model invent attributions that passed validation.
 */

// ── Publication homepages (prefer these over guessing a person from shared domains) ──
const DOMAIN_PUBLICATION: Record<string, string> = {
  "nakamotoinstitute.org": "Nakamoto Institute",
  "bitcoinmagazine.com": "Bitcoin Magazine",
  "mises.org": "Mises Institute",
  "dergigi.com": "Gigi",
  "21lessons.com": "Gigi",
};

// ── Well-known Bitcoin author → domain mapping ──
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
  "Nick Szabo": ["unenumerated.blogspot.com"],
  "Hal Finney": [],
  "Adam Back": ["blockstream.com"],
  "Eric Cason": ["cryptosovereignty.org"],
  "Hugo Nguyen": ["hugonguyen.medium.com"],
  "Hasu": ["uncommoncore.co", "insights.deribit.com"],
  "Tuur Demeester": ["adamant.io"],
  "Michael Saylor": ["microstrategy.com", "saylor.org"],
  "Cypherpunk Manifesto": ["activism.net"],
  "Murray Rothbard": [],
  "Ludwig von Mises": [],
  "Friedrich Hayek": [],
};

// Build domain → person (publication entries override in resolveAttributionFromUrl)
const DOMAIN_TO_AUTHOR = new Map<string, string>();
for (const [author, domains] of Object.entries(KNOWN_AUTHORS)) {
  for (const domain of domains) {
    DOMAIN_TO_AUTHOR.set(domain, author);
  }
}

function normalizeHost(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** True if a and b refer to the same person/org (substring / token overlap). */
function namesRoughlyMatch(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  const ax = x.split(/\s+/).filter((w) => w.length > 2);
  const by = y.split(/\s+/).filter((w) => w.length > 2);
  if (ax.length === 0 || by.length === 0) return false;
  return ax.some((w) => y.includes(w)) || by.some((w) => x.includes(w));
}

/**
 * Best-effort attribution from URL: publication name, else mapped author, else null.
 */
export function resolveAttributionFromUrl(url: string): string | null {
  if (!url) return null;
  const hostname = normalizeHost(url);
  if (!hostname) return null;

  for (const [domain, pub] of Object.entries(DOMAIN_PUBLICATION)) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) {
      return pub;
    }
  }

  const exact = DOMAIN_TO_AUTHOR.get(hostname);
  if (exact) return exact;

  // Subdomain match only for multi-part hosts (avoid matching "medium" globally)
  for (const [domain, author] of DOMAIN_TO_AUTHOR.entries()) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) {
      return author;
    }
  }

  return null;
}

/**
 * @deprecated Use resolveAttributionFromUrl — kept for tests and call sites
 */
export function authorFromUrl(url: string): string | null {
  return resolveAttributionFromUrl(url);
}

/**
 * Validate and correct the source attribution. Resolved URL (publication / known domain) wins over a mismatched AI label.
 */
export function validateSource(
  aiSource: string,
  citationUrl: string,
  citations: string[],
  knownSources?: Array<{ name: string; url?: string | null }>,
): string {
  const trimmed = (aiSource || "").trim();
  const seen = new Set<string>();
  const orderedUrls = [citationUrl, ...citations].filter((u): u is string => {
    if (!u || seen.has(u)) return false;
    seen.add(u);
    return true;
  });

  for (const url of orderedUrls) {
    const fromUrl = resolveAttributionFromUrl(url);
    if (!fromUrl) continue;
    if (trimmed && namesRoughlyMatch(trimmed, fromUrl)) {
      return trimmed;
    }
    return fromUrl;
  }

  // Catalog names (pause sources)
  if (knownSources) {
    const low = trimmed.toLowerCase();
    for (const src of knownSources) {
      if (src.name && low.includes(src.name.toLowerCase())) return trimmed;
    }
  }

  // Known author names in AI text (only when no URL mapped — weak)
  const low = trimmed.toLowerCase();
  for (const author of Object.keys(KNOWN_AUTHORS)) {
    if (low.includes(author.toLowerCase())) return trimmed;
  }

  // Transparency: append hostname when we keep a free-form label
  if (citationUrl) {
    try {
      const hostname = normalizeHost(citationUrl);
      if (hostname && !low.includes(hostname.split(".")[0])) {
        return trimmed ? `${trimmed} (via ${hostname})` : hostname;
      }
    } catch { /* ignore */ }
  }

  return trimmed;
}
