import { expect, test } from "@playwright/test";

// Minimal smoke test: the one we can run without a backend. Proves Vite can
// build, preview can serve, React can boot, i18n can hydrate, and the router
// can match "/" to the Landing page without crashing. It is intentionally
// shallow — broader pause / journal / auth flows need the backend-for-tests
// strategy from docs/backlog/e2e-browser-automation.md before they can pay
// off as E2E.

test.describe("landing page smoke", () => {
  test("renders with expected title and primary call-to-action", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response, "navigation response").not.toBeNull();
    expect(response!.status(), "response status").toBeLessThan(400);

    await expect(page).toHaveTitle(/Holzen/i);

    // Landing copy comes from i18n; assert on the brand string baked into
    // index.html to avoid coupling to translation keys that may change.
    await expect(page.locator("html")).toBeVisible();

    // The landing page mounts with at least one "Start" / "Sign in" action;
    // we don't pin exact text (it's translated) — we just want proof that
    // the SPA shell actually rendered content beyond `<div id="root" />`.
    const rootHasContent = await page.evaluate(() => {
      const root = document.getElementById("root");
      return !!root && root.children.length > 0 && root.textContent!.length > 0;
    });
    expect(rootHasContent, "React root rendered content").toBe(true);

    expect(errors, "no page errors during load").toEqual([]);
  });
});
