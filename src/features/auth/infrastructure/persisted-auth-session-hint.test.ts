import { afterEach, describe, expect, it } from "vitest";
import { hasPersistedAuthSessionHint } from "./persisted-auth-session-hint";

/** Vitest default `VITE_SUPABASE_URL` is `http://127.0.0.1:55421` → `sb-127-auth-token`. */
const TEST_AUTH_KEY = "sb-127-auth-token";

describe("hasPersistedAuthSessionHint", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("is false when localStorage has no auth token", () => {
    expect(hasPersistedAuthSessionHint()).toBe(false);
  });

  it("is true when the project auth token is present", () => {
    localStorage.setItem(TEST_AUTH_KEY, JSON.stringify({ access_token: "x" }));
    expect(hasPersistedAuthSessionHint()).toBe(true);
  });

  it("is false for an empty/null stored value", () => {
    localStorage.setItem(TEST_AUTH_KEY, "null");
    expect(hasPersistedAuthSessionHint()).toBe(false);
  });

  it("ignores unrelated keys", () => {
    localStorage.setItem("holzen_cookie_consent", "true");
    expect(hasPersistedAuthSessionHint()).toBe(false);
  });
});
