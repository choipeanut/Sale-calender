# Data Model

## Collections
- `brands`
- `events`
- `eventSources`
- `users`
- `favoriteBrands`
- `notificationPreferences`
- `notificationLogs`
- `crawlJobs`

## Core Fields
### Brand
- `id`, `name`, `slug`, `category`, `official_site_url`, `logo_url`, `is_active`

### Event
- `id`, `brand_id`, `title`, `slug`, `event_type`, `description`
- `start_date`, `end_date`, `date_precision`, `is_estimated`, `estimation_basis`
- `recurrence_pattern`, `status`, `confidence_score`
- `verification_status`, `announcement_status`, `last_verified_at`
- `sources[]`, `admin_note`, `has_correction`, `created_at`, `updated_at`

### EventSource
- `id`, `event_id`, `source_url`, `source_type`, `source_title`
- `collected_at`, `parsed_start_date`, `parsed_end_date`, `confidence_score`, `raw_excerpt`

### NotificationPreference
- `id`, `user_id`, `brand_id?`, `notify_7_days_before`, `notify_1_day_before`
- `notify_on_start`, `notify_custom_minutes_before`, `enabled`, `fcm_tokens[]`

### CrawlJob
- `id`, `source_target`, `started_at`, `finished_at`
- `status`, `items_found`, `errors_count`, `log_blob`

## Date Precision States
- `day`, `month`, `estimated`, `tbd`
