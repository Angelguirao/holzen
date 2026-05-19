import { useEffect } from "react";
import { SITE_ORIGIN } from "@/config/site";
import {
  DEFAULT_OG_IMAGE_URL,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
} from "@/config/site-seo-defaults";

interface PageMetaProps {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
}

const MANAGED_META_KEYS = [
  "description",
  "og:title",
  "og:description",
  "og:url",
  "twitter:title",
  "twitter:description",
  "robots",
] as const;

export function PageMeta({ title, description, path, noindex }: PageMetaProps) {
  useEffect(() => {
    document.title = title;
    setMeta("description", description, "name");
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("twitter:title", title, "name");
    setMeta("twitter:description", description, "name");

    if (path !== undefined) {
      setCanonical(`${SITE_ORIGIN}${path}`);
      setMeta("og:url", `${SITE_ORIGIN}${path}`, "property");
    }

    if (noindex) {
      setMeta("robots", "noindex, nofollow", "name");
    } else {
      removeMeta("robots", "name");
    }

    return () => {
      document.title = DEFAULT_SITE_TITLE;
      setMeta("description", DEFAULT_SITE_DESCRIPTION, "name");
      setMeta("og:title", DEFAULT_SITE_TITLE, "property");
      setMeta("og:description", DEFAULT_SITE_DESCRIPTION, "property");
      setMeta("twitter:title", DEFAULT_SITE_TITLE, "name");
      setMeta("twitter:description", DEFAULT_SITE_DESCRIPTION, "name");
      setCanonical(`${SITE_ORIGIN}/`);
      setMeta("og:url", `${SITE_ORIGIN}/`, "property");
      removeMeta("robots", "name");
    };
  }, [title, description, path, noindex]);

  return null;
}

/** App shell / auth / pause routes — keep out of search indexes without changing the tab title. */
export function RobotsNoIndex() {
  useEffect(() => {
    setMeta("robots", "noindex, nofollow", "name");
    return () => {
      removeMeta("robots", "name");
    };
  }, []);

  return null;
}

function setCanonical(href: string) {
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.href = href;
}

function setMeta(
  key: (typeof MANAGED_META_KEYS)[number] | string,
  content: string,
  attr: "name" | "property",
) {
  const selector =
    attr === "property" ? `meta[property="${key}"]` : `meta[name="${key}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMeta(key: string, attr: "name" | "property") {
  const selector =
    attr === "property" ? `meta[property="${key}"]` : `meta[name="${key}"]`;
  document.querySelector(selector)?.remove();
}
