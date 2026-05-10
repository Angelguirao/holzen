import { describe, expect, it } from "vitest";
import { logDependencyCall } from "../../supabase/functions/_shared/deps";

type LogRecord = {
  level: "info" | "warn" | "error";
  msg: string;
  extra?: Record<string, unknown>;
};

function createTestLogger(records: LogRecord[]) {
  const log = (msg: string, extra?: Record<string, unknown>) => {
    records.push({ level: "info", msg, extra });
  };
  log.warn = (msg: string, extra?: Record<string, unknown>) => {
    records.push({ level: "warn", msg, extra });
  };
  log.error = (msg: string, extra?: Record<string, unknown>) => {
    records.push({ level: "error", msg, extra });
  };
  return log as never;
}

describe("logDependencyCall", () => {
  it("logs expected status-code failures at warn level", async () => {
    const records: LogRecord[] = [];
    const error = new Error("push subscription expired") as Error & { statusCode: number };
    error.statusCode = 410;

    await expect(
      logDependencyCall(
        createTestLogger(records),
        "webpush",
        async () => {
          throw error;
        },
        { operation: "send", expectedStatusCodes: [404, 410] },
      ),
    ).rejects.toThrow("push subscription expired");

    expect(records).toEqual([
      {
        level: "warn",
        msg: "dependency_call",
        extra: expect.objectContaining({
          dep: "webpush",
          operation: "send",
          status: "expected_error",
          status_code: 410,
        }),
      },
    ]);
  });

  it("keeps unexpected dependency failures at error level", async () => {
    const records: LogRecord[] = [];

    await expect(
      logDependencyCall(
        createTestLogger(records),
        "webpush",
        async () => {
          const error = new Error("push provider unavailable") as Error & { statusCode: number };
          error.statusCode = 503;
          throw error;
        },
        { operation: "send", expectedStatusCodes: [404, 410] },
      ),
    ).rejects.toThrow("push provider unavailable");

    expect(records).toEqual([
      {
        level: "error",
        msg: "dependency_call",
        extra: expect.objectContaining({
          dep: "webpush",
          operation: "send",
          status: "error",
          status_code: 503,
        }),
      },
    ]);
  });
});
