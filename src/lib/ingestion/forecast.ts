import { addDays, addMonths, differenceInCalendarDays, formatISO, isValid, parseISO } from "date-fns";

import type { EventRecord } from "@/lib/types";

export interface CanonicalEventTemplate {
  key: string;
  brand_id: string;
  title: string;
  slug: string;
  event_type: string;
  recurrence_pattern: "quarterly" | "biannual" | "yearly";
  default_duration_days: number;
  aliases: string[];
  description: string;
  schedule: {
    months: number[];
    week_of_month?: number;
    weekday?: number;
    day_of_month?: number;
  };
}

interface HistoricalMatch {
  start: Date;
  end: Date;
}

export interface ParsedDateRange {
  start_date: string;
  end_date: string;
  confidence: number;
  evidence: string;
}

export interface EstimatedWindow {
  start_date: string;
  end_date: string;
  confidence: number;
  basis: string;
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[()[\]{}~!@#$%^&*_\-+=|:;"',.<>/?`]/g, "");

const sameOrContains = (left: string, right: string) => {
  if (!left || !right) {
    return false;
  }

  return left.includes(right) || right.includes(left);
};

const toIntervalMonths = (pattern: CanonicalEventTemplate["recurrence_pattern"]) => {
  if (pattern === "quarterly") {
    return 3;
  }

  if (pattern === "biannual") {
    return 6;
  }

  return 12;
};

const asDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    return null;
  }

  return parsed;
};

const clampToMonthEnd = (year: number, month: number, day: number) => {
  const maxDay = new Date(year, month, 0).getDate();
  return Math.max(1, Math.min(day, maxDay));
};

const nthWeekdayOfMonth = (year: number, month: number, weekday: number, nth: number) => {
  const first = new Date(year, month - 1, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  const safeDay = clampToMonthEnd(year, month, day);
  return new Date(year, month - 1, safeDay, 12, 0, 0);
};

const inferYear = (month: number, referenceDate: Date) => {
  const currentMonth = referenceDate.getMonth() + 1;
  let year = referenceDate.getFullYear();

  if (month < currentMonth - 2) {
    year += 1;
  }

  return year;
};

const toYmd = (date: Date) => formatISO(date, { representation: "date" });

const monthDistance = (a: number, b: number) => {
  const raw = Math.abs(a - b);
  return Math.min(raw, 12 - raw);
};

const parseDateTokens = (text: string, referenceDate: Date) => {
  const tokens: Array<{ date: Date; index: number; explicitYear: boolean }> = [];
  const fullDateRegex = /(20\d{2})\s*(?:년|[./-])\s*(\d{1,2})\s*(?:월|[./-])\s*(\d{1,2})\s*일?/g;
  const monthDayKorRegex = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/g;
  const monthDaySepRegex = /(^|[^\d])(\d{1,2})\s*[./-]\s*(\d{1,2})(?!\d)/g;

  const masked = text.replace(fullDateRegex, (match, year, month, day, index: number) => {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    const safeDay = clampToMonthEnd(y, m, d);

    tokens.push({
      date: new Date(y, m - 1, safeDay, 12, 0, 0),
      index,
      explicitYear: true,
    });

    return " ".repeat(match.length);
  });

  const masked2 = masked.replace(monthDayKorRegex, (match, month, day, index: number) => {
    const m = Number(month);
    const d = Number(day);
    const y = inferYear(m, referenceDate);
    const safeDay = clampToMonthEnd(y, m, d);

    tokens.push({
      date: new Date(y, m - 1, safeDay, 12, 0, 0),
      index,
      explicitYear: false,
    });

    return " ".repeat(match.length);
  });

  for (const match of masked2.matchAll(monthDaySepRegex)) {
    const leading = match[1] ?? "";
    const month = Number(match[2]);
    const day = Number(match[3]);
    const index = (match.index ?? 0) + leading.length;

    if (month > 12 || day > 31) {
      continue;
    }

    const year = inferYear(month, referenceDate);
    const safeDay = clampToMonthEnd(year, month, day);
    tokens.push({
      date: new Date(year, month - 1, safeDay, 12, 0, 0),
      index,
      explicitYear: false,
    });
  }

  const deduped = tokens
    .sort((a, b) => a.index - b.index)
    .filter((token, idx, arr) => {
      if (idx === 0) {
        return true;
      }

      const prev = arr[idx - 1];
      return Math.abs(prev.date.getTime() - token.date.getTime()) > 60 * 60 * 1000;
    });

  return deduped;
};

const computeRuleStart = (template: CanonicalEventTemplate, referenceDate: Date) => {
  const currentYear = referenceDate.getFullYear();
  const candidates: Date[] = [];

  for (let year = currentYear; year <= currentYear + 2; year += 1) {
    for (const month of template.schedule.months) {
      let candidate: Date;

      if (template.schedule.day_of_month) {
        candidate = new Date(year, month - 1, clampToMonthEnd(year, month, template.schedule.day_of_month), 12, 0, 0);
      } else {
        const weekday = template.schedule.weekday ?? 5;
        const nth = template.schedule.week_of_month ?? 2;
        candidate = nthWeekdayOfMonth(year, month, weekday, nth);
      }

      if (candidate >= addDays(referenceDate, -1)) {
        candidates.push(candidate);
      }
    }
  }

  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0] ?? addDays(referenceDate, 14);
};

const findHistoricalMatches = (
  template: CanonicalEventTemplate,
  existingEvents: EventRecord[],
  referenceDate: Date,
) => {
  const aliasSet = template.aliases.map((alias) => normalize(alias));
  const titleNorm = normalize(template.title);
  const slugNorm = normalize(template.slug);

  const matches: HistoricalMatch[] = [];
  for (const event of existingEvents) {
    if (event.brand_id !== template.brand_id || !event.start_date) {
      continue;
    }

    if (event.verification_status !== "verified" && event.announcement_status !== "official") {
      continue;
    }

    const eventNorm = normalize(event.title);
    const eventSlugNorm = normalize(event.slug);
    const matchedByAlias = aliasSet.some((alias) => sameOrContains(eventNorm, alias));
    const matchedByTitle = sameOrContains(eventNorm, titleNorm);
    const matchedBySlug = sameOrContains(eventSlugNorm, slugNorm);

    if (!matchedByAlias && !matchedByTitle && !matchedBySlug) {
      continue;
    }

    const start = asDate(event.start_date);
    const end = asDate(event.end_date ?? event.start_date);
    if (!start || !end) {
      continue;
    }

    if (end >= referenceDate) {
      continue;
    }

    const startMonth = start.getMonth() + 1;
    const monthCompatible = template.schedule.months.some((month) => monthDistance(month, startMonth) <= 1);
    if (!monthCompatible) {
      continue;
    }

    matches.push({ start, end });
  }

  return matches.sort((a, b) => b.start.getTime() - a.start.getTime());
};

export const EVENT_TEMPLATES: CanonicalEventTemplate[] = [
  {
    key: "oliveyoung-sale",
    brand_id: "brand-oliveyoung",
    title: "올영세일",
    slug: "oliveyoung-sale-spring",
    event_type: "season-sale",
    recurrence_pattern: "quarterly",
    default_duration_days: 7,
    aliases: ["올영세일", "올리브영 세일", "olive young sale"],
    description: "올리브영 대표 시즌 할인 행사",
    schedule: { months: [3, 6, 9, 12], week_of_month: 2, weekday: 5 },
  },
  {
    key: "musinsa-winter-blackfriday",
    brand_id: "brand-musinsa",
    title: "무진장 겨울 블랙프라이데이",
    slug: "musinsa-winter-blackfriday",
    event_type: "blackfriday",
    recurrence_pattern: "yearly",
    default_duration_days: 7,
    aliases: ["무진장 겨울 블랙프라이데이", "무신사 블랙프라이데이", "무신사 겨울 블프"],
    description: "무신사 겨울 메가 세일",
    schedule: { months: [11], week_of_month: 2, weekday: 5 },
  },
  {
    key: "musinsa-summer-blackfriday",
    brand_id: "brand-musinsa",
    title: "무진장 여름 블랙프라이데이",
    slug: "musinsa-summer-blackfriday",
    event_type: "blackfriday",
    recurrence_pattern: "yearly",
    default_duration_days: 7,
    aliases: ["무진장 여름 블랙프라이데이", "무신사 여름 블프"],
    description: "무신사 여름 메가 세일",
    schedule: { months: [6], week_of_month: 2, weekday: 5 },
  },
  {
    key: "29cm-29week",
    brand_id: "brand-29cm",
    title: "이구위크",
    slug: "29cm-29week",
    event_type: "fashion-week",
    recurrence_pattern: "biannual",
    default_duration_days: 6,
    aliases: ["이구위크", "29cm 이구위크", "29week"],
    description: "29CM 대표 할인 행사",
    schedule: { months: [3, 8], week_of_month: 4, weekday: 5 },
  },
  {
    key: "uniqlo-appreciation",
    brand_id: "brand-uniqlo",
    title: "유니클로 감사제",
    slug: "uniqlo-appreciation",
    event_type: "appreciation-sale",
    recurrence_pattern: "yearly",
    default_duration_days: 7,
    aliases: ["유니클로 감사제", "uniqlo 감사제"],
    description: "유니클로 감사 특별 행사",
    schedule: { months: [5], week_of_month: 3, weekday: 5 },
  },
  {
    key: "gmarket-bigsmile",
    brand_id: "brand-gmarket",
    title: "빅스마일데이",
    slug: "gmarket-bigsmile-day",
    event_type: "mega-sale",
    recurrence_pattern: "biannual",
    default_duration_days: 7,
    aliases: ["빅스마일데이", "g마켓 빅스마일", "빅스마일"],
    description: "G마켓/옥션 통합 대형 행사",
    schedule: { months: [5, 11], week_of_month: 2, weekday: 1 },
  },
  {
    key: "11st-grand1111",
    brand_id: "brand-11st",
    title: "그랜드십일절",
    slug: "11st-grand-1111",
    event_type: "mega-sale",
    recurrence_pattern: "yearly",
    default_duration_days: 7,
    aliases: ["그랜드십일절", "11번가 십일절", "11st 1111"],
    description: "11번가 대표 할인 행사",
    schedule: { months: [11], day_of_month: 11 },
  },
  {
    key: "coupang-wowweek",
    brand_id: "brand-coupang",
    title: "와우위크",
    slug: "coupang-wow-week",
    event_type: "wow-sale",
    recurrence_pattern: "biannual",
    default_duration_days: 7,
    aliases: ["와우위크", "와우 빅세일", "쿠팡 와우위크"],
    description: "쿠팡 와우 회원 대상 행사",
    schedule: { months: [4, 11], week_of_month: 1, weekday: 1 },
  },
];

export const getTemplatesForBrand = (brandId: string) => EVENT_TEMPLATES.filter((template) => template.brand_id === brandId);

export const hasTemplateMention = (text: string, template: CanonicalEventTemplate) => {
  const normalized = normalize(text);
  return template.aliases.some((alias) => sameOrContains(normalized, normalize(alias)));
};

export const extractDateRangeFromText = (text: string, referenceDate = new Date()): ParsedDateRange | null => {
  const tokens = parseDateTokens(text, referenceDate);

  if (tokens.length === 0) {
    return null;
  }

  const start = tokens[0].date;
  let end = tokens[1]?.date ?? tokens[0].date;

  if (end.getTime() < start.getTime()) {
    end = addMonths(end, 12);
  }

  const dayDistance = Math.abs(differenceInCalendarDays(end, start));

  let confidence = tokens[0].explicitYear ? 0.94 : 0.88;
  if (!tokens[1]) {
    confidence -= 0.06;
  } else if (tokens[1].explicitYear) {
    confidence += 0.03;
  }

  if (dayDistance > 31) {
    confidence -= 0.12;
  }

  return {
    start_date: toYmd(start),
    end_date: toYmd(end),
    confidence: Math.max(0.5, Math.min(0.99, confidence)),
    evidence: tokens[0].explicitYear ? "explicit-date-with-year" : "explicit-date",
  };
};

export const estimateWindowForTemplate = (
  template: CanonicalEventTemplate,
  existingEvents: EventRecord[],
  mentionFound: boolean,
  referenceDate = new Date(),
): EstimatedWindow => {
  const history = findHistoricalMatches(template, existingEvents, referenceDate);

  if (history.length > 0) {
    const latest = history[0];
    const intervalMonths = toIntervalMonths(template.recurrence_pattern);
    let next = latest.start;

    while (next <= addDays(referenceDate, -1)) {
      next = addMonths(next, intervalMonths);
    }

    const durations = history.slice(0, 3).map((item) => Math.max(1, differenceInCalendarDays(item.end, item.start) + 1));
    const averageDuration = Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
    const duration = Math.max(template.default_duration_days, averageDuration || template.default_duration_days);
    const end = addDays(next, duration - 1);

    let confidence = 0.72 + Math.min(0.12, history.length * 0.04);
    if (mentionFound) {
      confidence += 0.06;
    }

    return {
      start_date: toYmd(next),
      end_date: toYmd(end),
      confidence: Math.min(0.9, confidence),
      basis: mentionFound
        ? `공식 페이지 행사명 감지 + 과거 일정(${toYmd(latest.start)}) 기반 ${intervalMonths}개월 주기 추정`
        : `과거 일정(${toYmd(latest.start)}) 기반 ${intervalMonths}개월 주기 추정`,
    };
  }

  const start = computeRuleStart(template, referenceDate);
  const end = addDays(start, template.default_duration_days - 1);

  return {
    start_date: toYmd(start),
    end_date: toYmd(end),
    confidence: mentionFound ? 0.66 : 0.56,
    basis: mentionFound ? "공식 페이지 행사명 감지 + 예년 시즌 규칙 기반 추정" : "예년 시즌 규칙 기반 추정",
  };
};
