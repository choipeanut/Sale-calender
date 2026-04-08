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

  it("does not merge different seasonal campaigns even if source url is the same", () => {
    const left = {
      ...seedEvents[1],
      id: "event-musinsa-summer",
      title: "무진장 여름 블랙프라이데이",
      slug: "musinsa-summer-blackfriday",
      start_date: "2026-06-10",
      end_date: "2026-06-16",
      sources: [
        {
          ...seedEvents[1].sources[0],
          id: "source-musinsa-shared",
          source_url: "https://www.musinsa.com/events",
        },
      ],
    };

    const right = {
      ...seedEvents[1],
      id: "event-musinsa-winter",
      title: "무진장 겨울 블랙프라이데이",
      slug: "musinsa-winter-blackfriday",
      start_date: "2026-11-12",
      end_date: "2026-11-18",
      sources: [
        {
          ...seedEvents[1].sources[0],
          id: "source-musinsa-shared-2",
          source_url: "https://www.musinsa.com/events",
        },
      ],
    };

    const duplicates = findDuplicateCandidates([left, right]);

    expect(duplicates).toHaveLength(0);
  });
});
