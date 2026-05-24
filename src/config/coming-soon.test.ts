import { describe, expect, it, vi } from "vitest";
import { isComingSoonMode } from "./coming-soon";

describe("isComingSoonMode", () => {
  it("is false when unset", () => {
    vi.stubEnv("VITE_COMING_SOON", "");
    expect(isComingSoonMode()).toBe(false);
  });

  it("is true for common truthy strings", () => {
    vi.stubEnv("VITE_COMING_SOON", "true");
    expect(isComingSoonMode()).toBe(true);
    vi.stubEnv("VITE_COMING_SOON", "1");
    expect(isComingSoonMode()).toBe(true);
  });
});
