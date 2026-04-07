import { describe, expect, it } from "vitest";

import { findDuplicateCandidates } from "@/lib/ingestion/dedupe";
import { seedEvents } from "@/lib/data/seed";

describe("dedupe", () => {
  it("finds duplicate when title/date/source are similar", () => {
    const base = seedEvents[0];
    const candidate = {
      ...base,
      id: "event-duplicate",
      confidence_score: 0.4,
      title: `${base.title} 안내`,
    };

    const duplicates = findDuplicateCandidates([base, candidate]);

    expect(duplicates.length).toBeGreaterThanOrEqual(1);
    expect(duplicates[0].duplicate.id).toBe("event-duplicate");
  });
});
