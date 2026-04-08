import { load } from "cheerio";
import { addDays, formatISO } from "date-fns";

import {
  estimateWindowForTemplate,
  extractDateRangeFromText,
  getTemplatesForBrand,
  hasTemplateMention,
  type CanonicalEventTemplate,
} from "@/lib/ingestion/forecast";
import { sourceRegistry } from "@/lib/ingestion/registry";
import type { EventRecord, EventSource, SourceRegistryItem } from "@/lib/types";

const defaultHeaders = {
  "User-Agent": "Mozilla/5.0 (compatible; SaleCalendarBot/1.0; +https://github.com/choipeanut/Sale-calender)",
};

const normalizeText = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .replace(/[\[\]]/g, "")
    .trim();

const containsDateSignal = (text: string) =>
  /(20\d{2}\s*(?:년|[./-])\s*\d{1,2}\s*(?:월|[./-])\s*\d{1,2}\s*일?)|(\d{1,2}\s*월\s*\d{1,2}\s*일)|(\d{1,2}\s*[./-]\s*\d{1,2})/u.test(
    text,
  );

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-가-힣]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-|\-$/g, "");

const estimatedWindow = () => {
  const start = addDays(new Date(), 14);
  const end = addDays(start, 4);

  return {
    start: formatISO(start, { representation: "date" }),
    end: formatISO(end, { representation: "date" }),
  };
};

const collectCandidates = (html: string) => {
  const $ = load(html);
  const selector = "a, h1, h2, h3, p, li, .event, .title, .banner, .promotion";
  const nodes = Array.from($(selector).slice(0, 260));

  const texts = nodes
    .map((node) => normalizeText($(node).text()))
    .filter((text) => text.length >= 4 && text.length <= 140)
    .filter((text) => /세일|할인|위크|블랙|감사|페스타|이벤트|쇼핑|쿠폰|데이/i.test(text));

  return Array.from(new Set(texts));
};

const buildSource = (payload: {
  eventId: string;
  source: SourceRegistryItem;
  confidence: number;
  parsedStart?: string | null;
  parsedEnd?: string | null;
  rawExcerpt?: string;
}): EventSource => ({
  id: `source-${payload.eventId}`,
  event_id: payload.eventId,
  source_url: payload.source.source_url,
  source_type: payload.source.source_type,
  source_title: payload.source.label,
  collected_at: formatISO(new Date()),
  parsed_start_date: payload.parsedStart ?? null,
  parsed_end_date: payload.parsedEnd ?? null,
  confidence_score: payload.confidence,
  raw_excerpt: payload.rawExcerpt,
});

const buildTemplateEvent = (payload: {
  source: SourceRegistryItem;
  template: CanonicalEventTemplate;
  existingEvents: EventRecord[];
  mentionFound: boolean;
  snippet?: string;
  explicitRange?: {
    start_date: string;
    end_date: string;
    confidence: number;
    evidence: string;
  } | null;
}): EventRecord => {
  const now = formatISO(new Date());
  const id = `ingest-${payload.source.brand_id}-${payload.template.key}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  if (payload.explicitRange) {
    const confidenceBoost = payload.source.source_type === "official_event" ? 0.03 : 0.01;
    const confidence = Math.min(0.99, payload.explicitRange.confidence + confidenceBoost);

    const eventSource = buildSource({
      eventId: id,
      source: payload.source,
      confidence,
      parsedStart: payload.explicitRange.start_date,
      parsedEnd: payload.explicitRange.end_date,
      rawExcerpt: payload.snippet ?? payload.template.title,
    });

    return {
      id,
      brand_id: payload.source.brand_id,
      title: payload.template.title,
      slug: payload.template.slug,
      event_type: payload.template.event_type,
      description: `${payload.template.description} (공식 공지 기반 일정 확정)`,
      start_date: payload.explicitRange.start_date,
      end_date: payload.explicitRange.end_date,
      date_precision: "day",
      is_estimated: false,
      estimation_basis: null,
      recurrence_pattern: payload.template.recurrence_pattern,
      status: "scheduled",
      confidence_score: confidence,
      verification_status: "verified",
      announcement_status: "official",
      last_verified_at: now,
      sources: [eventSource],
      created_at: now,
      updated_at: now,
    };
  }

  const estimated = estimateWindowForTemplate(
    payload.template,
    payload.existingEvents,
    payload.mentionFound,
    new Date(),
  );

  const eventSource = buildSource({
    eventId: id,
    source: payload.source,
    confidence: estimated.confidence,
    parsedStart: estimated.start_date,
    parsedEnd: estimated.end_date,
    rawExcerpt: payload.snippet ?? "행사명 감지 또는 시즌 패턴 기반 추정",
  });

  return {
    id,
    brand_id: payload.source.brand_id,
    title: payload.template.title,
    slug: payload.template.slug,
    event_type: payload.template.event_type,
    description: `${payload.template.description} (예상 일정)`,
    start_date: estimated.start_date,
    end_date: estimated.end_date,
    date_precision: "estimated",
    is_estimated: true,
    estimation_basis: estimated.basis,
    recurrence_pattern: payload.template.recurrence_pattern,
    status: "scheduled",
    confidence_score: estimated.confidence,
    verification_status: "pending",
    announcement_status: "inferred",
    last_verified_at: now,
    sources: [eventSource],
    created_at: now,
    updated_at: now,
  };
};

const buildFallbackEvent = (source: SourceRegistryItem): EventRecord => {
  const window = estimatedWindow();
  const id = `ingest-${source.brand_id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = formatISO(new Date());

  const eventSource = buildSource({
    eventId: id,
    source,
    confidence: 0.4,
    parsedStart: window.start,
    parsedEnd: window.end,
    rawExcerpt: "Fallback estimate from ingestion pipeline",
  });

  return {
    id,
    brand_id: source.brand_id,
    title: `${source.label} 시즌 행사`,
    slug: `${source.brand_id}-${toSlug(source.label)}-${Date.now()}`,
    event_type: "season-sale",
    description: "공식 페이지 구조 변동으로 예상 일정으로 수집됨",
    start_date: window.start,
    end_date: window.end,
    date_precision: "estimated",
    is_estimated: true,
    estimation_basis: "source fallback parser",
    recurrence_pattern: "seasonal",
    status: "scheduled",
    confidence_score: 0.4,
    verification_status: "pending",
    announcement_status: "inferred",
    last_verified_at: now,
    sources: [eventSource],
    created_at: now,
    updated_at: now,
  };
};

const extractRangeFromContext = (snippet: string, candidates: string[]) => {
  const direct = extractDateRangeFromText(snippet);
  if (direct) {
    return direct;
  }

  const dateNeighbor = candidates.filter(containsDateSignal).slice(0, 4).join(" ");
  if (!dateNeighbor) {
    return null;
  }

  return extractDateRangeFromText(`${snippet} ${dateNeighbor}`);
};

const buildBrandForecastEvents = (source: SourceRegistryItem, templates: CanonicalEventTemplate[], existingEvents: EventRecord[]) => {
  if (templates.length === 0) {
    return [buildFallbackEvent(source)];
  }

  return templates.map((template) =>
    buildTemplateEvent({
      source,
      template,
      existingEvents,
      mentionFound: false,
      snippet: "공식 페이지 행사명 미감지, 시즌 패턴 추정",
      explicitRange: null,
    }),
  );
};

const parseHtmlSource = async (source: SourceRegistryItem, existingEvents: EventRecord[]): Promise<EventRecord[]> => {
  const brandEvents = existingEvents.filter((event) => event.brand_id === source.brand_id);
  const templates = getTemplatesForBrand(source.brand_id);

  try {
    const response = await fetch(source.source_url, {
      headers: defaultHeaders,
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return buildBrandForecastEvents(source, templates, brandEvents);
    }

    const html = await response.text();
    const candidates = collectCandidates(html);

    if (templates.length === 0) {
      return [buildFallbackEvent(source)];
    }

    if (candidates.length === 0) {
      return buildBrandForecastEvents(source, templates, brandEvents);
    }

    const output: EventRecord[] = [];

    for (const template of templates) {
      const snippet = candidates.find((candidate) => hasTemplateMention(candidate, template));

      if (snippet) {
        const explicitRange = extractRangeFromContext(snippet, candidates);

        output.push(
          buildTemplateEvent({
            source,
            template,
            existingEvents: brandEvents,
            mentionFound: true,
            snippet,
            explicitRange,
          }),
        );
        continue;
      }

      output.push(
        buildTemplateEvent({
          source,
          template,
          existingEvents: brandEvents,
          mentionFound: false,
          snippet: "공식 페이지 행사명 미감지, 시즌 패턴 추정",
          explicitRange: null,
        }),
      );
    }

    return output;
  } catch {
    return buildBrandForecastEvents(source, templates, brandEvents);
  }
};

export const parseSources = async (existingEvents: EventRecord[] = []) => {
  const activeSources = sourceRegistry.filter((item) => item.active);

  const output: EventRecord[] = [];
  for (const source of activeSources) {
    const parsed = await parseHtmlSource(source, existingEvents);
    output.push(...parsed);
    await new Promise((resolve) => setTimeout(resolve, Math.max(200, source.rate_limit_seconds * 5)));
  }

  return output;
};
