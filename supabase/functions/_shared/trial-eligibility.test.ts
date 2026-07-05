import { describe, expect, it } from "vitest";
import {
  customerHasPriorSubscriptionHistory,
  isDisposableEmailDomain,
  normalizeEmailForTrialFingerprint,
} from "./trial-eligibility.ts";

describe("normalizeEmailForTrialFingerprint", () => {
  it("collapses Gmail aliases", () => {
    expect(normalizeEmailForTrialFingerprint("Jane.Doe+promo@gmail.com")).toBe(
      normalizeEmailForTrialFingerprint("janedoe@gmail.com"),
    );
    expect(normalizeEmailForTrialFingerprint("a@googlemail.com")).toBe("a@gmail.com");
  });
});

describe("isDisposableEmailDomain", () => {
  it("blocks known throwaways", () => {
    expect(isDisposableEmailDomain("x@mailinator.com")).toBe(true);
    expect(isDisposableEmailDomain("x@gmail.com")).toBe(false);
  });
});

describe("customerHasPriorSubscriptionHistory", () => {
  it("is true when any sub exists", () => {
    expect(customerHasPriorSubscriptionHistory([{ id: "sub_1" } as never])).toBe(true);
    expect(customerHasPriorSubscriptionHistory([])).toBe(false);
  });
});
