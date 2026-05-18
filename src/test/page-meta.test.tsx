/** @vitest-environment jsdom */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageMeta } from "@/components/PageMeta";
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
} from "@/config/site-seo-defaults";
import { SITE_ORIGIN } from "@/config/site";

describe("PageMeta", () => {
  it("restores default head tags on unmount", () => {
    document.head.innerHTML = `
      <title>${DEFAULT_SITE_TITLE}</title>
      <meta name="description" content="${DEFAULT_SITE_DESCRIPTION}" />
      <link rel="canonical" href="${SITE_ORIGIN}/" />
      <meta property="og:title" content="${DEFAULT_SITE_TITLE}" />
      <meta property="og:description" content="${DEFAULT_SITE_DESCRIPTION}" />
      <meta property="og:url" content="${SITE_ORIGIN}/" />
      <meta name="twitter:title" content="${DEFAULT_SITE_TITLE}" />
      <meta name="twitter:description" content="${DEFAULT_SITE_DESCRIPTION}" />
    `;

    const { unmount } = render(
      <PageMeta
        title="Blog — Holzen"
        description="A post about pausing."
        path="/blog/test"
      />,
    );

    expect(document.title).toBe("Blog — Holzen");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "A post about pausing.",
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      `${SITE_ORIGIN}/blog/test`,
    );

    unmount();

    expect(document.title).toBe(DEFAULT_SITE_TITLE);
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      DEFAULT_SITE_DESCRIPTION,
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      `${SITE_ORIGIN}/`,
    );
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(
      `${SITE_ORIGIN}/`,
    );
  });
});
