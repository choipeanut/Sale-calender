# Admin Walkthrough

1. Open `/admin`.
2. Select event from review dropdown.
3. Click `선택 이벤트 승인` to mark verified.
4. Trigger `수집 재실행` to run parser+dedupe.
5. Review crawl jobs table and notification log cards.

## Admin Controls Implemented
- event status/verification patch
- ingestion rerun
- notification log visibility
- merge API support (`/api/admin/events/merge`)
