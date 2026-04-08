import { addDays, formatISO } from "date-fns";

import type {
  Brand,
  CrawlJob,
  EventRecord,
  FavoriteBrand,
  NotificationLog,
  NotificationPreference,
  SourceRegistryItem,
  UserProfile,
} from "@/lib/types";

const now = new Date();
const toDateOnly = (date: Date) => formatISO(date, { representation: "date" });

const pickNextAnnualDate = (month: number, day: number) => {
  const candidate = new Date(now.getFullYear(), month - 1, day);
  if (candidate < now) {
    candidate.setFullYear(candidate.getFullYear() + 1);
  }

  return candidate;
};

const pickNextFromMonths = (months: number[], day: number) => {
  const candidates = months.map((month) => pickNextAnnualDate(month, day)).sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
};

const pickNextOliveyoungDayStart = () => {
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 25);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth(), 27, 23, 59, 59);

  if (now <= thisMonthEnd) {
    return thisMonthStart;
  }

  return new Date(now.getFullYear(), now.getMonth() + 1, 25);
};

const oliveyoungSaleStart = pickNextFromMonths([3, 6, 9, 12], 1);
const oliveyoungSaleEnd = addDays(oliveyoungSaleStart, 6);
const oliveyoungDayStart = pickNextOliveyoungDayStart();
const oliveyoungDayEnd = new Date(oliveyoungDayStart.getFullYear(), oliveyoungDayStart.getMonth(), 27);
const musinsaWinterStart = pickNextAnnualDate(11, 16);
const musinsaWinterEnd = addDays(musinsaWinterStart, 10);
const twentynineWeekStart = pickNextFromMonths([6, 11], 4);
const twentynineWeekEnd = addDays(twentynineWeekStart, 9);
const uniqloStart = pickNextAnnualDate(5, 15);
const uniqloEnd = addDays(uniqloStart, 6);
const gmarketStart = pickNextFromMonths([5, 11], 11);
const gmarketEnd = addDays(gmarketStart, 6);
const elevenStart = pickNextAnnualDate(11, 11);
const elevenEnd = addDays(elevenStart, 6);
const coupangStart = pickNextFromMonths([4, 11], 1);
const coupangEnd = addDays(coupangStart, 6);

export const seedBrands: Brand[] = [
  {
    id: "brand-oliveyoung",
    name: "올리브영",
    slug: "oliveyoung",
    category: "beauty",
    official_site_url: "https://www.oliveyoung.co.kr/",
    is_active: true,
  },
  {
    id: "brand-musinsa",
    name: "무신사",
    slug: "musinsa",
    category: "fashion",
    official_site_url: "https://www.musinsa.com/",
    is_active: true,
  },
  {
    id: "brand-29cm",
    name: "29CM",
    slug: "29cm",
    category: "fashion",
    official_site_url: "https://www.29cm.co.kr/",
    is_active: true,
  },
  {
    id: "brand-uniqlo",
    name: "유니클로",
    slug: "uniqlo",
    category: "spa",
    official_site_url: "https://www.uniqlo.com/kr/ko/",
    is_active: true,
  },
  {
    id: "brand-gmarket",
    name: "G마켓",
    slug: "gmarket",
    category: "mall",
    official_site_url: "https://www.gmarket.co.kr/",
    is_active: true,
  },
  {
    id: "brand-11st",
    name: "11번가",
    slug: "11st",
    category: "mall",
    official_site_url: "https://www.11st.co.kr/",
    is_active: true,
  },
  {
    id: "brand-coupang",
    name: "쿠팡",
    slug: "coupang",
    category: "mall",
    official_site_url: "https://www.coupang.com/",
    is_active: true,
  },
];

export const seedEvents: EventRecord[] = [
  {
    id: "event-oliveyoung-sale",
    brand_id: "brand-oliveyoung",
    title: "올영세일",
    slug: "oliveyoung-sale",
    event_type: "season-sale",
    description: "올리브영 대표 정기 대형 할인 행사",
    start_date: toDateOnly(oliveyoungSaleStart),
    end_date: toDateOnly(oliveyoungSaleEnd),
    date_precision: "estimated",
    is_estimated: true,
    estimation_basis: "올영세일 정기 패턴(3월·6월·9월·12월) 기반 추정",
    recurrence_pattern: "quarterly",
    status: "scheduled",
    confidence_score: 0.78,
    verification_status: "pending",
    announcement_status: "inferred",
    last_verified_at: formatISO(addDays(now, -1)),
    admin_note: "공식 확정 공지 전 추정 일정",
    has_correction: false,
    sources: [
      {
        id: "source-oliveyoung-official",
        event_id: "event-oliveyoung-sale",
        source_url: "https://www.oliveyoung.co.kr/store/main/getEventList.do",
        source_type: "official_event",
        source_title: "올리브영 이벤트 페이지",
        collected_at: formatISO(addDays(now, -1)),
        parsed_start_date: toDateOnly(oliveyoungSaleStart),
        parsed_end_date: toDateOnly(oliveyoungSaleEnd),
        confidence_score: 0.78,
        raw_excerpt: "올영세일 정기 패턴(분기별) 기반 추정",
      },
    ],
    created_at: formatISO(addDays(now, -20)),
    updated_at: formatISO(addDays(now, -1)),
  },
  {
    id: "event-oliveyoung-day",
    brand_id: "brand-oliveyoung",
    title: "올영데이",
    slug: "oliveyoung-day",
    event_type: "monthly-membership-sale",
    description: "올리브영 멤버십 중심 월간 행사",
    start_date: toDateOnly(oliveyoungDayStart),
    end_date: toDateOnly(oliveyoungDayEnd),
    date_precision: "estimated",
    is_estimated: true,
    estimation_basis: "운영 규칙(매월 25~27일) 기반 추정",
    recurrence_pattern: "monthly",
    status: "scheduled",
    confidence_score: 0.58,
    verification_status: "pending",
    announcement_status: "manual",
    last_verified_at: formatISO(addDays(now, -1)),
    admin_note: "월간 고정 이벤트로 관리. 공식 확정 공지 시 승격 필요",
    has_correction: true,
    sources: [
      {
        id: "source-oliveyoung-day-manual",
        event_id: "event-oliveyoung-day",
        source_url: "https://www.oliveyoung.co.kr/store/main/main.do",
        source_type: "manual_input",
        source_title: "운영자 규칙 입력",
        collected_at: formatISO(addDays(now, -1)),
        parsed_start_date: toDateOnly(oliveyoungDayStart),
        parsed_end_date: toDateOnly(oliveyoungDayEnd),
        confidence_score: 0.58,
        raw_excerpt: "올영데이 매월 25~27일 운영 규칙",
      },
    ],
    created_at: formatISO(addDays(now, -20)),
    updated_at: formatISO(addDays(now, -1)),
  },
  {
    id: "event-musinsa-winter-blackfriday",
    brand_id: "brand-musinsa",
    title: "무진장 겨울 블랙프라이데이",
    slug: "musinsa-winter-blackfriday",
    event_type: "blackfriday",
    description: "무신사 겨울 메가 세일",
    start_date: toDateOnly(musinsaWinterStart),
    end_date: toDateOnly(musinsaWinterEnd),
    date_precision: "estimated",
    is_estimated: true,
    estimation_basis: "무신사 뉴스룸 기반(겨울 블프 11월 중순 패턴) 추정",
    recurrence_pattern: "yearly",
    status: "scheduled",
    confidence_score: 0.76,
    verification_status: "pending",
    announcement_status: "inferred",
    last_verified_at: formatISO(addDays(now, -2)),
    admin_note: "공식 확정 공지 전 추정 일정",
    has_correction: false,
    sources: [
      {
        id: "source-musinsa-newsroom",
        event_id: "event-musinsa-winter-blackfriday",
        source_url: "https://newsroom.musinsa.com/newsroom-menu/2025-1114",
        source_type: "official_newsroom",
        source_title: "무신사 뉴스룸",
        collected_at: formatISO(addDays(now, -2)),
        parsed_start_date: toDateOnly(musinsaWinterStart),
        parsed_end_date: toDateOnly(musinsaWinterEnd),
        confidence_score: 0.76,
        raw_excerpt: "무진장 겨울 블프 11월 중순~하순 진행 이력",
      },
    ],
    created_at: formatISO(addDays(now, -30)),
    updated_at: formatISO(addDays(now, -2)),
  },
  {
    id: "event-29cm-29week",
    brand_id: "brand-29cm",
    title: "이구위크",
    slug: "29cm-29week",
    event_type: "fashion-week",
    description: "29CM 대표 할인 행사",
    start_date: toDateOnly(twentynineWeekStart),
    end_date: toDateOnly(twentynineWeekEnd),
    date_precision: "estimated",
    is_estimated: true,
    estimation_basis: "29CM 여름/겨울 이구위크 시즌 패턴 기반 추정",
    recurrence_pattern: "biannual",
    status: "scheduled",
    confidence_score: 0.74,
    verification_status: "pending",
    announcement_status: "inferred",
    last_verified_at: formatISO(addDays(now, -1)),
    has_correction: false,
    sources: [
      {
        id: "source-29cm-newsroom",
        event_id: "event-29cm-29week",
        source_url: "https://newsroom.musinsa.com/newsroom-menu/2025-0616-29cm",
        source_type: "official_newsroom",
        source_title: "29CM/무신사 뉴스룸",
        collected_at: formatISO(addDays(now, -1)),
        parsed_start_date: toDateOnly(twentynineWeekStart),
        parsed_end_date: toDateOnly(twentynineWeekEnd),
        confidence_score: 0.74,
        raw_excerpt: "이구위크 시즌성(여름/겨울) 대형 행사",
      },
    ],
    created_at: formatISO(addDays(now, -14)),
    updated_at: formatISO(addDays(now, -1)),
  },
  {
    id: "event-uniqlo-appreciation",
    brand_id: "brand-uniqlo",
    title: "유니클로 감사제",
    slug: "uniqlo-appreciation",
    event_type: "appreciation-sale",
    description: "시즌 감사 특별 행사",
    start_date: toDateOnly(uniqloStart),
    end_date: toDateOnly(uniqloEnd),
    date_precision: "estimated",
    is_estimated: true,
    estimation_basis: "최근 3년간 5월 중순 시작 패턴",
    recurrence_pattern: "yearly",
    status: "scheduled",
    confidence_score: 0.61,
    verification_status: "pending",
    announcement_status: "inferred",
    last_verified_at: formatISO(addDays(now, -3)),
    has_correction: true,
    admin_note: "공식 공지 전, 추정 일정",
    sources: [
      {
        id: "source-uniqlo-news",
        event_id: "event-uniqlo-appreciation",
        source_url: "https://www.uniqlo.com/kr/ko/news",
        source_type: "official_newsroom",
        source_title: "유니클로 뉴스",
        collected_at: formatISO(addDays(now, -3)),
        parsed_start_date: toDateOnly(uniqloStart),
        parsed_end_date: toDateOnly(uniqloEnd),
        confidence_score: 0.61,
      },
    ],
    created_at: formatISO(addDays(now, -60)),
    updated_at: formatISO(addDays(now, -3)),
  },
  {
    id: "event-gmarket-bigsmile",
    brand_id: "brand-gmarket",
    title: "빅스마일데이",
    slug: "gmarket-bigsmile-day",
    event_type: "mega-sale",
    description: "G마켓/옥션 통합 대형 행사",
    start_date: toDateOnly(gmarketStart),
    end_date: toDateOnly(gmarketEnd),
    date_precision: "estimated",
    is_estimated: true,
    estimation_basis: "작년 일정 및 사전 티저 기준",
    recurrence_pattern: "biannual",
    status: "scheduled",
    confidence_score: 0.67,
    verification_status: "pending",
    announcement_status: "inferred",
    last_verified_at: formatISO(addDays(now, -1)),
    sources: [
      {
        id: "source-gmarket-news",
        event_id: "event-gmarket-bigsmile",
        source_url: "https://www.gmarket.co.kr/n/smile",
        source_type: "official_notice",
        source_title: "G마켓 공지",
        collected_at: formatISO(addDays(now, -1)),
        parsed_start_date: toDateOnly(gmarketStart),
        parsed_end_date: toDateOnly(gmarketEnd),
        confidence_score: 0.67,
      },
    ],
    created_at: formatISO(addDays(now, -45)),
    updated_at: formatISO(addDays(now, -1)),
  },
  {
    id: "event-11st-grand1111",
    brand_id: "brand-11st",
    title: "그랜드십일절",
    slug: "11st-grand-1111",
    event_type: "mega-sale",
    description: "11번가 대표 행사",
    start_date: toDateOnly(elevenStart),
    end_date: toDateOnly(elevenEnd),
    date_precision: "estimated",
    is_estimated: true,
    estimation_basis: "그랜드십일절(11월) 시즌 패턴 기반 추정",
    recurrence_pattern: "yearly",
    status: "scheduled",
    confidence_score: 0.72,
    verification_status: "pending",
    announcement_status: "inferred",
    last_verified_at: formatISO(addDays(now, -2)),
    sources: [
      {
        id: "source-11st-notice",
        event_id: "event-11st-grand1111",
        source_url: "https://www.11st.co.kr/main",
        source_type: "official_notice",
        source_title: "11번가 메인 공지",
        collected_at: formatISO(addDays(now, -2)),
        parsed_start_date: toDateOnly(elevenStart),
        parsed_end_date: toDateOnly(elevenEnd),
        confidence_score: 0.72,
      },
    ],
    created_at: formatISO(addDays(now, -100)),
    updated_at: formatISO(addDays(now, -2)),
  },
  {
    id: "event-coupang-wowweek",
    brand_id: "brand-coupang",
    title: "와우위크",
    slug: "coupang-wow-week",
    event_type: "wow-sale",
    description: "와우 회원 대상 할인 이벤트",
    start_date: toDateOnly(coupangStart),
    end_date: toDateOnly(coupangEnd),
    date_precision: "estimated",
    is_estimated: true,
    estimation_basis: "쿠팡 와우 이벤트 계절 패턴 기반 추정",
    recurrence_pattern: "biannual",
    status: "scheduled",
    confidence_score: 0.58,
    verification_status: "pending",
    announcement_status: "inferred",
    last_verified_at: formatISO(addDays(now, -4)),
    admin_note: "공식 티저/공지 확인 시 확정 필요",
    has_correction: false,
    sources: [
      {
        id: "source-coupang-manual",
        event_id: "event-coupang-wowweek",
        source_url: "https://www.coupang.com/",
        source_type: "official_notice",
        source_title: "쿠팡 메인",
        collected_at: formatISO(addDays(now, -4)),
        parsed_start_date: toDateOnly(coupangStart),
        parsed_end_date: toDateOnly(coupangEnd),
        confidence_score: 0.58,
      },
    ],
    created_at: formatISO(addDays(now, -12)),
    updated_at: formatISO(addDays(now, -4)),
  },
];

export const seedUsers: UserProfile[] = [
  {
    id: "demo-user",
    email: "demo@salecalendar.app",
    auth_provider: "google",
    created_at: formatISO(addDays(now, -200)),
  },
];

export const seedFavoriteBrands: FavoriteBrand[] = [
  { id: "fav-1", user_id: "demo-user", brand_id: "brand-oliveyoung" },
  { id: "fav-2", user_id: "demo-user", brand_id: "brand-musinsa" },
  { id: "fav-3", user_id: "demo-user", brand_id: "brand-29cm" },
];

export const seedNotificationPreferences: NotificationPreference[] = [
  {
    id: "pref-global-demo",
    user_id: "demo-user",
    brand_id: null,
    notify_7_days_before: true,
    notify_1_day_before: true,
    notify_on_start: true,
    notify_custom_minutes_before: 180,
    enabled: true,
    fcm_tokens: [],
  },
  {
    id: "pref-musinsa-demo",
    user_id: "demo-user",
    brand_id: "brand-musinsa",
    notify_7_days_before: false,
    notify_1_day_before: true,
    notify_on_start: true,
    notify_custom_minutes_before: null,
    enabled: true,
    fcm_tokens: [],
  },
];

export const seedNotificationLogs: NotificationLog[] = [
  {
    id: "noti-1",
    user_id: "demo-user",
    event_id: "event-musinsa-winter-blackfriday",
    notification_type: "days_1",
    scheduled_at: formatISO(addDays(musinsaWinterStart, -1)),
    sent_at: null,
    status: "scheduled",
  },
];

export const seedCrawlJobs: CrawlJob[] = [
  {
    id: "crawl-1",
    source_target: "all:daily",
    started_at: formatISO(addDays(now, -1)),
    finished_at: formatISO(addDays(now, -1)),
    status: "completed",
    items_found: 8,
    errors_count: 0,
    log_blob: "Daily ingestion run complete.",
  },
];

export const sourceRegistry: SourceRegistryItem[] = [
  {
    brand_id: "brand-oliveyoung",
    label: "올리브영 이벤트",
    source_type: "official_event",
    source_url: "https://www.oliveyoung.co.kr/store/main/getEventList.do",
    active: true,
    parser_hint: "html",
    rate_limit_seconds: 30,
  },
  {
    brand_id: "brand-musinsa",
    label: "무신사 이벤트",
    source_type: "official_event",
    source_url: "https://www.musinsa.com/events",
    active: true,
    parser_hint: "html",
    rate_limit_seconds: 30,
  },
  {
    brand_id: "brand-29cm",
    label: "29CM 이벤트",
    source_type: "official_event",
    source_url: "https://www.29cm.co.kr/event",
    active: true,
    parser_hint: "html",
    rate_limit_seconds: 30,
  },
  {
    brand_id: "brand-uniqlo",
    label: "유니클로 뉴스",
    source_type: "official_newsroom",
    source_url: "https://www.uniqlo.com/kr/ko/news",
    active: true,
    parser_hint: "html",
    rate_limit_seconds: 30,
  },
  {
    brand_id: "brand-gmarket",
    label: "G마켓 공지",
    source_type: "official_notice",
    source_url: "https://www.gmarket.co.kr/n/smile",
    active: true,
    parser_hint: "html",
    rate_limit_seconds: 30,
  },
  {
    brand_id: "brand-11st",
    label: "11번가 메인",
    source_type: "official_notice",
    source_url: "https://www.11st.co.kr/main",
    active: true,
    parser_hint: "html",
    rate_limit_seconds: 30,
  },
  {
    brand_id: "brand-coupang",
    label: "쿠팡 메인",
    source_type: "official_notice",
    source_url: "https://www.coupang.com/",
    active: true,
    parser_hint: "html",
    rate_limit_seconds: 30,
  },
];
