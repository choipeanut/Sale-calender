# Dedupe Merge Example

## Real Pipeline Case
- primary: `event-musinsa-winter-blackfriday`
- duplicate: `ingest-brand-musinsa-1775572290024`
- reason: `same-source-url`

## Merge Behavior
1. Keep higher-confidence canonical event.
2. Merge duplicate source list into canonical `sources[]`.
3. Set duplicate event `status=inactive`.
4. Keep merge trace through crawl job and admin inspection.

## Why This Matters
- One event may appear in multiple pages/news updates.
- Canonical merge prevents duplicate cards in user calendar views.
