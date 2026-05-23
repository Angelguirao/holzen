import { describe, expect, it } from "vitest";
import { suppressionFromResendEvent } from "../../../supabase/functions/_shared/resend-suppression-map.ts";

describe("suppressionFromResendEvent", () => {
  it("maps permanent bounces to suppression", () => {
    const result = suppressionFromResendEvent({
      type: "email.bounced",
      data: {
        email_id: "abc",
        to: ["user@example.com"],
        bounce: { type: "Permanent", subType: "Suppressed" },
      },
    });
    expect(result).toMatchObject({
      email: "user@example.com",
      reason: "bounce",
      message_id: "abc",
    });
  });

  it("ignores temporary bounces", () => {
    const result = suppressionFromResendEvent({
      type: "email.bounced",
      data: {
        to: ["user@example.com"],
        bounce: { type: "Temporary" },
      },
    });
    expect(result).toBeNull();
  });

  it("maps complaints to suppression", () => {
    const result = suppressionFromResendEvent({
      type: "email.complained",
      data: {
        email_id: "xyz",
        to: ["user@example.com"],
      },
    });
    expect(result).toMatchObject({
      email: "user@example.com",
      reason: "complaint",
      message_id: "xyz",
    });
  });
});
