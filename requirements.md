# Sale Calendar Requirements

## Product Goal
- Aggregate major domestic sale events into a single calendar.
- Let users select favorite brands and receive pre-start / start-day notifications.
- Provide source links and verification metadata for every event.

## MVP Scope
- PWA web app (mobile-first) with install support.
- Views: Home, Monthly Calendar, List, Upcoming, Event Detail.
- Features: search, filters, favorite brands, notification preferences.
- Admin: event review, update, merge duplicates, manual creation, crawl run.
- Ingestion: source registry, parser, dedupe, change detection, crawl logs.

## Non-functional
- Asia/Seoul timezone handling.
- Fast first-load and friendly error/empty states.
- Public-source-only ingestion respecting robots/rate limits.

## Success Criteria
- At least 5 brands managed in DB-backed structure.
- User can save favorites and notification settings.
- Admin can correct events and rerun ingestion.
- Source links and last verification timestamp visible on detail page.
