import { describe, expect, it } from "vitest";
import { determineSessionIntent } from "../../supabase/functions/_shared/session-intent";

describe("determineSessionIntent", () => {
  it("falls back to neutral-exploration with no signals", () => {
    expect(determineSessionIntent({}).theme).toBe("neutral-exploration");
  });

  it("picks patience-during-fear for fearful mood regardless of direction", () => {
    expect(
      determineSessionIntent({ mood: "fearful", context: "BTC is up 2%", severity: 2 }).theme,
    ).toBe("patience-during-fear");
  });

  it("picks patience-during-fear for anxious + severity >= 7", () => {
    expect(determineSessionIntent({ mood: "anxious", severity: 7 }).theme).toBe(
      "patience-during-fear",
    );
  });

  it("picks steadiness-during-anxiety for anxious + low severity", () => {
    expect(determineSessionIntent({ mood: "anxious", severity: 3 }).theme).toBe(
      "steadiness-during-anxiety",
    );
  });

  it("picks grounding-during-fomo for fomo or greedy moods", () => {
    expect(determineSessionIntent({ mood: "fomo" }).theme).toBe("grounding-during-fomo");
    expect(determineSessionIntent({ mood: "greedy" }).theme).toBe("grounding-during-fomo");
  });

  it("picks humility-during-euphoria for excited + up market", () => {
    expect(
      determineSessionIntent({ mood: "excited", context: "BTC is up 3.2% today" }).theme,
    ).toBe("humility-during-euphoria");
  });

  it("picks affirmation-of-composure for calm or detached moods", () => {
    expect(determineSessionIntent({ mood: "calm" }).theme).toBe("affirmation-of-composure");
    expect(determineSessionIntent({ mood: "detached" }).theme).toBe("affirmation-of-composure");
  });

  it("falls back to market-only themes when mood is unknown but severity is meaningful", () => {
    expect(
      determineSessionIntent({ context: "BTC is down 8%", severity: 8 }).theme,
    ).toBe("patience-during-fear");
    expect(
      determineSessionIntent({ context: "BTC is up 6%", severity: 6 }).theme,
    ).toBe("humility-during-euphoria");
  });

  it("picks reflection-on-selling when >30% of recent outcomes are sells during a drop", () => {
    const moodHistory = [
      { mood: "fearful", outcome: "sold" },
      { mood: "anxious", outcome: "sold" },
      { mood: "calm", outcome: "held" },
    ];
    expect(
      determineSessionIntent({ moodHistory, context: "BTC is down 5%", mood: "fearful" }).theme,
    ).toBe("reflection-on-selling");
  });

  it("ignores the sell-pattern gate below the 3-session threshold", () => {
    const moodHistory = [
      { mood: "fearful", outcome: "sold" },
      { mood: "anxious", outcome: "sold" },
    ];
    // 2 outcomes < required 3 → not applied; falls through to mood path.
    expect(
      determineSessionIntent({ moodHistory, context: "BTC is down 5%", mood: "fearful" }).theme,
    ).toBe("patience-during-fear");
  });

  it("returns the full SessionIntent record with theme metadata", () => {
    const intent = determineSessionIntent({ mood: "calm" });
    expect(intent.theme).toBe("affirmation-of-composure");
    expect(intent.emotionalTone).toBe("affirming");
    expect(intent.themeDescription.length).toBeGreaterThan(0);
    expect(intent.historyMood).toBe("neutral");
  });
});
