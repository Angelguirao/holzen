/** Capture and persist landing attribution (UTM + ref) for waitlist signup. */

export type LandingAttribution = {
  ref: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

const STORAGE_KEY = "holzen_landing_attribution";

const EMPTY: LandingAttribution = {
  ref: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
};

function trimParam(value: string | null, max: number): string | null {
  if (!value) return null;
  const t = value.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

export function readAttributionFromSearch(
  params: URLSearchParams,
): LandingAttribution {
  return {
    ref: trimParam(params.get("ref"), 128),
    utm_source: trimParam(params.get("utm_source"), 64),
    utm_medium: trimParam(params.get("utm_medium"), 64),
    utm_campaign: trimParam(params.get("utm_campaign"), 128),
    utm_content: trimParam(params.get("utm_content"), 128),
    utm_term: trimParam(params.get("utm_term"), 128),
  };
}

export function attributionHasSignal(attr: LandingAttribution): boolean {
  return Boolean(
    attr.ref ||
      attr.utm_source ||
      attr.utm_medium ||
      attr.utm_campaign ||
      attr.utm_content ||
      attr.utm_term,
  );
}

export function persistAttribution(attr: LandingAttribution): void {
  if (typeof sessionStorage === "undefined") return;
  if (!attributionHasSignal(attr)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attr));
  } catch {
    /* private mode / quota */
  }
}

export function loadPersistedAttribution(): LandingAttribution | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LandingAttribution>;
    return {
      ref: typeof parsed.ref === "string" ? parsed.ref : null,
      utm_source: typeof parsed.utm_source === "string" ? parsed.utm_source : null,
      utm_medium: typeof parsed.utm_medium === "string" ? parsed.utm_medium : null,
      utm_campaign:
        typeof parsed.utm_campaign === "string" ? parsed.utm_campaign : null,
      utm_content:
        typeof parsed.utm_content === "string" ? parsed.utm_content : null,
      utm_term: typeof parsed.utm_term === "string" ? parsed.utm_term : null,
    };
  } catch {
    return null;
  }
}

/** Prefer fresh URL params; fall back to session so UTMs survive in-page scroll. */
export function resolveLandingAttribution(
  params: URLSearchParams,
): LandingAttribution {
  const fromUrl = readAttributionFromSearch(params);
  if (attributionHasSignal(fromUrl)) {
    persistAttribution(fromUrl);
    return fromUrl;
  }
  return loadPersistedAttribution() ?? EMPTY;
}
