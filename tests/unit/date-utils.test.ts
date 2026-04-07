import { describe, expect, it } from "vitest";

import { formatDateRangeKR, toEventStatus } from "@/lib/utils/date";

describe("date utils", () => {
  it("formats date range", () => {
    expect(formatDateRangeKR("2026-04-10", "2026-04-12")).toBe("2026.04.10 ~ 2026.04.12");
  });

  it("returns scheduled when start date is future", () => {
    const status = toEventStatus({
      start_date: "2099-01-01",
      end_date: "2099-01-03",
      status: "scheduled",
    });

    expect(status).toBe("scheduled");
  });
});
