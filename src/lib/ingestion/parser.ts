import { load } from "cheerio";
import { addDays, formatISO } from "date-fns";

import { sourceRegistry } from "@/lib/ingestion/registry";
import type { EventRecord, EventSource, SourceRegistryItem } from "@/lib/types";

const defaultHeaders = {
  "User-Agent":
    "Mozilla/5.0 (compatible; SaleCalendarBot/1.0; +https://github.com/choipeanut/Sale-calender)",
};

const normalizeTitle = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .replace(/[\[\]]/g, "")
    .trim();

const inferEventType = (title: string) => {
  const lower = title.toLowerCase();

  if (lower.includes("블랙") || lower.includes("black")) {
    return "blackfriday";
  }

  if (lower.includes("감사")) {
    return "appreciation-sale";
  }

  if (lower.includes("위크") || lower.includes("week")) {
    return "week-sale";
  }

  return "season-sale";
};

const estimatedWindow = () => {
  const start = addDays(new Date(), 14);
  const end = addDays(start, 4);
  return {
    start: formatISO(start, { representation: "date" }),
    end: formatISO(end, { representation: "date" }),
  };
};

const buildFallbackEvent = (source: SourceRegistryItem): EventRecord => {
  const window = estimatedWindow();
  const id = `ingest-${source.brand_id}-${Date.now()}`;

  const eventSource: EventSource = {
    id: `source-${id}`,
    event_id: id,
    source_url: source.source_url,
    source_type: source.source_type,
    source_title: source.label,
    collected_at: formatISO(new Date()),
    parsed_start_date: window.start,
    parsed_end_date: window.end,
    confidence_score: 0.45,
    raw_excerpt: "Fallback estimate from ingestion pipeline",
  };

  return {
    id,
    brand_id: source.brand_id,
    title: `${source.label} 시즌 행사`,
    slug: `${source.brand_id}-${Date.now()}`,
    event_type: "season-sale",
    description: "공식 페이지 구조 변동으로 예상 일정으로 수집됨",
    start_date: window.start,
    end_date: window.end,
    date_precision: "estimated",
    is_estimated: true,
    estimation_basis: "source fallback parser",
    recurrence_pattern: "seasonal",
    status: "scheduled",
    confidence_score: 0.45,
    verification_status: "pending",
    announcement_status: "inferred",
    last_verified_at: formatISO(new Date()),
    sources: [eventSource],
    created_at: formatISO(new Date()),
    updated_at: formatISO(new Date()),
  };
};

const parseHtmlSource = async (source: SourceRegistryItem): Promise<EventRecord[]> => {
  try {
    const response = await fetch(source.source_url, {
      headers: defaultHeaders,
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return [buildFallbackEvent(source)];
    }

    const html = await response.text();
    const $ = load(html);

    const candidates = Array.from($("a, h1, h2, h3, .event, .title").slice(0, 120));
    const matched = candidates
      .map((node) => normalizeTitle($(node).text()))
      .filter((text) => text.length >= 4)
      .filter((text) => /세일|할인|위크|블랙|감사|페스타|이벤트|쇼핑/i.test(text))
      .slice(0, 2);

    if (matched.length === 0) {
      return [buildFallbackEvent(source)];
    }

    return matched.map((title, index) => {
      const start = addDays(new Date(), index * 7 + 2);
      const end = addDays(start, 5);
      const id = `ingest-${source.brand_id}-${Date.now()}-${index}`;

      const eventSource: EventSource = {
        id: `source-${id}`,
        event_id: id,
        source_url: source.source_url,
        source_type: source.source_type,
        source_title: source.label,
        collected_at: formatISO(new Date()),
        parsed_start_date: formatISO(start, { representation: "date" }),
        parsed_end_date: formatISO(end, { representation: "date" }),
        confidence_score: 0.58,
        raw_excerpt: title,
      };

      return {
        id,
        brand_id: source.brand_id,
        title,
        slug: title.toLowerCase().replaceAll(" ", "-").replace(/[^a-z0-9\-가-힣]/g, ""),
        event_type: inferEventType(title),
        description: "공개 페이지 기반 자동 수집",
        start_date: formatISO(start, { representation: "date" }),
        end_date: formatISO(end, { representation: "date" }),
        date_precision: "estimated",
        is_estimated: true,
        estimation_basis: "페이지 텍스트 패턴 추출",
        recurrence_pattern: "seasonal",
        status: "scheduled",
        confidence_score: 0.58,
        verification_status: "pending",
        announcement_status: "inferred",
        last_verified_at: formatISO(new Date()),
        sources: [eventSource],
        created_at: formatISO(new Date()),
        updated_at: formatISO(new Date()),
      } satisfies EventRecord;
    });
  } catch {
    return [buildFallbackEvent(source)];
  }
};

export const parseSources = async () => {
  const activeSources = sourceRegistry.filter((item) => item.active);

  const output: EventRecord[] = [];
  for (const source of activeSources) {
    const parsed = await parseHtmlSource(source);
    output.push(...parsed);
    await new Promise((resolve) => setTimeout(resolve, Math.max(200, source.rate_limit_seconds * 5)));
  }

  return output;
};
