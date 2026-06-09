import {
  customerHasPriorSubscriptionHistory,
  isDisposableEmailDomain,
  normalizeEmailForTrialFingerprint,
} from "./trial-eligibility.ts";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

Deno.test("normalizeEmailForTrialFingerprint collapses Gmail aliases", () => {
  assert(
    normalizeEmailForTrialFingerprint("Jane.Doe+promo@gmail.com") ===
      normalizeEmailForTrialFingerprint("janedoe@gmail.com"),
    "gmail alias normalization",
  );
  assert(
    normalizeEmailForTrialFingerprint("a@googlemail.com") === "a@gmail.com",
    "googlemail domain",
  );
});

Deno.test("isDisposableEmailDomain blocks known throwaways", () => {
  assert(isDisposableEmailDomain("x@mailinator.com"), "mailinator");
  assert(!isDisposableEmailDomain("x@gmail.com"), "gmail ok");
});

Deno.test("customerHasPriorSubscriptionHistory is true when any sub exists", () => {
  assert(
    customerHasPriorSubscriptionHistory([{ id: "sub_1" } as never]),
    "prior sub blocks",
  );
  assert(!customerHasPriorSubscriptionHistory([]), "empty allows");
});
