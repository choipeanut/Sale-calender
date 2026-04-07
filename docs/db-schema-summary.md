# DB Schema Summary

## Firestore Collections
- `brands`: brand metadata and category taxonomy.
- `events`: canonical event records with precision and verification fields.
- `eventSources`: optional split collection if source arrays are normalized.
- `favoriteBrands`: user-brand join table.
- `notificationPreferences`: per-user and per-brand alert settings.
- `notificationLogs`: alert scheduling and send history.
- `crawlJobs`: ingestion run history and error logs.

## Index Recommendations
- `events`: `brand_id + start_date`, `status + start_date`.
- `favoriteBrands`: `user_id`.
- `notificationPreferences`: `user_id + brand_id`.
- `crawlJobs`: `started_at desc`.
