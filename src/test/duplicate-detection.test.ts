import { describe, expect, it } from "vitest";
import { detectDuplicates } from "@/lib/duplicate-detection";
import type { LibraryItem } from "@/hooks/use-library";

function reflection(
  id: string,
  body: string,
  createdAt: string,
  overrides: Partial<LibraryItem> = {},
): LibraryItem {
  return {
    id,
    user_id: "u1",
    type: "reflection",
    title: null,
    body,
    source_type: "reflection",
    source_url: null,
    reflection_id: null,
    tags: [],
    pinned: false,
    is_favorite: false,
    status: "unread",
    created_at: createdAt,
    ...overrides,
  };
}

describe("detectDuplicates", () => {
  it("returns [] when there are fewer than two reflections", () => {
    expect(detectDuplicates([])).toEqual([]);
    expect(
      detectDuplicates([reflection("a", "Something thoughtful to reflect upon today.", "2024-01-01")]),
    ).toEqual([]);
  });

  it("ignores non-reflection source_types, deleted items, and short bodies", () => {
    const items: LibraryItem[] = [
      reflection("long1", "Holding through the volatility is my practice today.", "2024-01-01", {
        source_type: "haiku",
      }),
      reflection("long2", "Holding through the volatility is my practice today.", "2024-01-02", {
        status: "deleted",
      }),
      reflection("tiny", "short", "2024-01-03"),
    ];
    expect(detectDuplicates(items)).toEqual([]);
  });

  it("groups near-duplicates and picks the oldest as the primary", () => {
    const items: LibraryItem[] = [
      reflection(
        "b",
        "Holding through volatility is my practice today when prices drop.",
        "2024-01-02",
      ),
      reflection(
        "a",
        "Holding through volatility is my practice today when prices drop suddenly.",
        "2024-01-01",
      ),
      reflection(
        "c",
        "Completely different reflection about gratitude and presence of mind.",
        "2024-01-03",
      ),
    ];
    const groups = detectDuplicates(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].primary.id).toBe("a");
    expect(groups[0].duplicates.map((d) => d.id)).toEqual(["b"]);
    expect(groups[0].score).toBeGreaterThan(0.6);
  });

  it("does not group items below the similarity threshold", () => {
    const items: LibraryItem[] = [
      reflection("a", "Volatility reveals my patience through each passing day always.", "2024-01-01"),
      reflection("b", "Entirely unrelated note about gardening tomatoes and bees today.", "2024-01-02"),
    ];
    expect(detectDuplicates(items)).toEqual([]);
  });
});
