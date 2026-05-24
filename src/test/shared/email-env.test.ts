import { afterEach, describe, expect, it } from "vitest";
import {
  prefixEmailSubject,
  resolveEmailAppUrl,
  resolveEmailFromAddress,
  resolveEmailFromDomain,
  resolveNotifyFromAddress,
} from "../../../supabase/functions/_shared/email-env.ts";

const ENV_KEYS = [
  "EMAIL_BRAND_NAME",
  "EMAIL_FROM_DOMAIN",
  "EMAIL_FROM_LOCAL",
  "EMAIL_SENDER_DOMAIN",
  "EMAIL_ROOT_DOMAIN",
  "EMAIL_APP_URL",
  "EMAIL_SUBJECT_PREFIX",
  "EMAIL_NOTIFY_LOCAL",
  "EMAIL_FEEDBACK_INBOX",
  "EMAIL_VAPID_MAILTO_LOCAL",
] as const;

function clearEmailEnv(): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

describe("email-env", () => {
  afterEach(() => {
    clearEmailEnv();
  });

  it("uses production defaults when env is unset", () => {
    expect(resolveEmailFromDomain()).toBe("holzen.app");
    expect(resolveEmailFromAddress()).toBe("holzen <noreply@holzen.app>");
    expect(resolveNotifyFromAddress()).toBe("holzen <notify@holzen.app>");
    expect(resolveEmailAppUrl()).toBe("https://holzen.app");
  });

  it("applies staging resend.dev overrides", () => {
    process.env.EMAIL_FROM_DOMAIN = "resend.dev";
    process.env.EMAIL_FROM_LOCAL = "onboarding";
    process.env.EMAIL_NOTIFY_LOCAL = "onboarding";
    process.env.EMAIL_BRAND_NAME = "Holzen Staging";
    process.env.EMAIL_SUBJECT_PREFIX = "[STAGING]";
    process.env.EMAIL_APP_URL = "http://localhost:8080";

    expect(resolveEmailFromAddress()).toBe("Holzen Staging <onboarding@resend.dev>");
    expect(resolveNotifyFromAddress()).toBe("Holzen Staging <onboarding@resend.dev>");
    expect(prefixEmailSubject("Confirm your email")).toBe("[STAGING] Confirm your email");
    expect(resolveEmailAppUrl()).toBe("http://localhost:8080");
  });

  it("does not double-prefix subjects", () => {
    process.env.EMAIL_SUBJECT_PREFIX = "[STAGING]";
    expect(prefixEmailSubject("[STAGING] Already prefixed")).toBe("[STAGING] Already prefixed");
  });
});
