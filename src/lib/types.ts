export type BrandCategory = "beauty" | "fashion" | "spa" | "mall" | "national";

export type EventStatus = "scheduled" | "ongoing" | "ended" | "draft" | "hold" | "inactive";

export type DatePrecision = "day" | "month" | "estimated" | "tbd";

export type AnnouncementStatus = "official" | "inferred" | "manual";

export type VerificationStatus = "verified" | "pending" | "rejected";

export type SourceType =
  | "official_event"
  | "official_newsroom"
  | "official_notice"
  | "news_article"
  | "manual_input";

export type NotificationType = "days_7" | "days_1" | "on_start" | "custom";

export type CrawlJobStatus = "queued" | "running" | "completed" | "failed";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  category: BrandCategory;
  official_site_url: string;
  logo_url?: string;
  is_active: boolean;
}

export interface EventSource {
  id: string;
  event_id: string;
  source_url: string;
  source_type: SourceType;
  source_title: string;
  collected_at: string;
  parsed_start_date?: string | null;
  parsed_end_date?: string | null;
  confidence_score: number;
  raw_excerpt?: string;
}

export interface EventRecord {
  id: string;
  brand_id: string;
  title: string;
  slug: string;
  event_type: string;
  description: string;
  start_date?: string | null;
  end_date?: string | null;
  date_precision: DatePrecision;
  is_estimated: boolean;
  estimation_basis?: string | null;
  recurrence_pattern?: string | null;
  status: EventStatus;
  confidence_score: number;
  verification_status: VerificationStatus;
  announcement_status: AnnouncementStatus;
  last_verified_at?: string | null;
  sources: EventSource[];
  admin_note?: string;
  has_correction?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  auth_provider: "google" | "email_link";
  created_at: string;
}

export interface FavoriteBrand {
  id: string;
  user_id: string;
  brand_id: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  brand_id?: string | null;
  notify_7_days_before: boolean;
  notify_1_day_before: boolean;
  notify_on_start: boolean;
  notify_custom_minutes_before?: number | null;
  enabled: boolean;
  fcm_tokens?: string[];
}

export interface NotificationLog {
  id: string;
  user_id: string;
  event_id: string;
  notification_type: NotificationType;
  scheduled_at: string;
  sent_at?: string | null;
  status: "scheduled" | "sent" | "failed" | "skipped";
  message?: string;
}

export interface CrawlJob {
  id: string;
  source_target: string;
  started_at: string;
  finished_at?: string | null;
  status: CrawlJobStatus;
  items_found: number;
  errors_count: number;
  log_blob?: string;
}

export interface SourceRegistryItem {
  brand_id: string;
  label: string;
  source_type: SourceType;
  source_url: string;
  active: boolean;
  parser_hint: "html" | "rss" | "manual";
  rate_limit_seconds: number;
}

export interface EventFilters {
  brand?: string;
  category?: BrandCategory;
  month?: string;
  status?: "scheduled" | "ongoing" | "ended";
  favorite_only?: boolean;
  q?: string;
  user_id?: string;
}

export interface CalendarEventView {
  id: string;
  title: string;
  start?: string;
  end?: string;
  allDay: boolean;
  extendedProps: {
    eventType: string;
    category: BrandCategory;
    brandName: string;
    status: EventStatus;
    isEstimated: boolean;
    datePrecision: DatePrecision;
    hasSource: boolean;
    isFavoriteBrand: boolean;
  };
}

export interface PublicEventResponse {
  event: EventRecord;
  brand: Brand;
  similarHistory: Array<Pick<EventRecord, "id" | "title" | "start_date" | "end_date" | "status">>;
}

export interface IngestionResult {
  crawled: number;
  merged: number;
  created: number;
  updated: number;
  failed: number;
  duplicateCandidates: Array<{ primaryId: string; duplicateId: string; reason: string }>;
}
