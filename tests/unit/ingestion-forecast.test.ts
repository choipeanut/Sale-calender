import { describe, expect, it } from "vitest";

import {
  EVENT_TEMPLATES,
  estimateWindowForTemplate,
  extractDateRangeFromText,
  hasTemplateMention,
} from "@/lib/ingestion/forecast";
import type { EventRecord } from "@/lib/types";

describe("ingestion forecast", () => {
  it("extracts explicit date range with year", () => {
    const parsed = extractDateRangeFromText("올영세일은 2026년 6월 5일 ~ 2026년 6월 11일 진행됩니다.");

    expect(parsed).not.toBeNull();
    expect(parsed?.start_date).toBe("2026-06-05");
    expect(parsed?.end_date).toBe("2026-06-11");
    expect(parsed?.confidence).toBeGreaterThan(0.9);
  });

  it("extracts month/day date range using reference year", () => {
    const parsed = extractDateRangeFromText("무진장 여름 블프 6월 14일-6월 20일", new Date("2026-04-01T00:00:00+09:00"));

    expect(parsed).not.toBeNull();
    expect(parsed?.start_date).toBe("2026-06-14");
    expect(parsed?.end_date).toBe("2026-06-20");
  });

  it("estimates next window from historical official events", () => {
    const template = EVENT_TEMPLATES.find((item) => item.key === "musinsa-winter-blackfriday");
    expect(template).toBeDefined();

    const history: EventRecord[] = [
      {
        id: "event-history-1",
        brand_id: "brand-musinsa",
        title: "무진장 겨울 블랙프라이데이",
        slug: "musinsa-winter-blackfriday",
        event_type: "blackfriday",
        description: "",
        start_date: "2025-11-14",
        end_date: "2025-11-20",
        date_precision: "day",
        is_estimated: false,
        estimation_basis: null,
        recurrence_pattern: "yearly",
        status: "ended",
        confidence_score: 0.95,
        verification_status: "verified",
        announcement_status: "official",
        last_verified_at: "2025-11-21T00:00:00+09:00",
        sources: [],
        created_at: "2025-11-01T00:00:00+09:00",
        updated_at: "2025-11-21T00:00:00+09:00",
      },
    ];

    const estimated = estimateWindowForTemplate(
      template!,
      history,
      true,
      new Date("2026-04-01T00:00:00+09:00"),
    );

    expect(estimated.start_date).toBe("2026-11-14");
    expect(estimated.end_date).toBe("2026-11-20");
    expect(estimated.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it("matches major event aliases", () => {
    const template = EVENT_TEMPLATES.find((item) => item.key === "oliveyoung-sale");
    expect(template).toBeDefined();
    expect(hasTemplateMention("올리브영 올영세일 사전 공지", template!)).toBe(true);
  });

  it("estimates oliveyoung day on 25th to 27th window", () => {
    const template = EVENT_TEMPLATES.find((item) => item.key === "oliveyoung-day");
    expect(template).toBeDefined();

    const estimated = estimateWindowForTemplate(
      template!,
      [],
      true,
      new Date("2026-04-08T00:00:00+09:00"),
    );

    expect(estimated.start_date).toBe("2026-04-25");
    expect(estimated.end_date).toBe("2026-04-27");
  });
});
