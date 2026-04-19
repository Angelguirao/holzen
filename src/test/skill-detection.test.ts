import { describe, expect, it } from "vitest";
import { detectSkills, type SkillType } from "@/lib/skill-detection";

function base(overrides: Parameters<typeof detectSkills>[0] = {}) {
  return overrides;
}

describe("detectSkills", () => {
  it("detects no skills for an empty reflection", () => {
    expect(detectSkills(base())).toEqual([]);
  });

  it("detects regulation when mood composure improves", () => {
    expect(detectSkills(base({ mood: "fearful", mood_after: "calm" }))).toContain("regulation");
  });

  it("does not detect regulation when composure decreases or is unchanged", () => {
    expect(detectSkills(base({ mood: "calm", mood_after: "fearful" }))).not.toContain("regulation");
    expect(detectSkills(base({ mood: "calm", mood_after: "calm" }))).not.toContain("regulation");
  });

  it("detects regulation when breathing is completed even without a mood shift", () => {
    expect(detectSkills(base({ breathing_completed: true }))).toContain("regulation");
  });

  it("does not double-add regulation when both conditions are true", () => {
    const skills = detectSkills(
      base({ mood: "anxious", mood_after: "calm", breathing_completed: true }),
    );
    expect(skills.filter((s: SkillType) => s === "regulation")).toHaveLength(1);
  });

  it("detects tolerance only when volatility >= 3% and outcome is held/nothing", () => {
    expect(detectSkills(base({ context: "BTC ↓7.5%", outcome: "held" }))).toContain("tolerance");
    expect(detectSkills(base({ context: "BTC ↓7.5%", outcome: "nothing" }))).toContain("tolerance");
    expect(detectSkills(base({ context: "BTC ↓2.9%", outcome: "held" }))).not.toContain("tolerance");
    expect(detectSkills(base({ context: "BTC ↓7.5%", outcome: "sold" }))).not.toContain("tolerance");
  });

  it("detects alignment when the user held or did nothing", () => {
    expect(detectSkills(base({ outcome: "held" }))).toContain("alignment");
    expect(detectSkills(base({ outcome: "nothing" }))).toContain("alignment");
    expect(detectSkills(base({ outcome: "sold" }))).not.toContain("alignment");
  });

  it("detects reappraisal when any perspective companion was read", () => {
    expect(detectSkills(base({ zoom_out_read: true }))).toContain("reappraisal");
    expect(detectSkills(base({ history_read: true }))).toContain("reappraisal");
    expect(detectSkills(base({ signal_read: true }))).toContain("reappraisal");
    expect(detectSkills(base({ grounding_read: true }))).toContain("reappraisal");
  });

  it("detects awareness from a substantive note, any tags, or a favorite", () => {
    expect(detectSkills(base({ note: "Short" }))).not.toContain("awareness");
    expect(detectSkills(base({ note: "This is a longer reflection note." }))).toContain("awareness");
    expect(detectSkills(base({ tags: ["panic"] }))).toContain("awareness");
    expect(detectSkills(base({ is_favorite: true }))).toContain("awareness");
  });
});
