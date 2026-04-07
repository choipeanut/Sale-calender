# Ingestion Sample Log

## Executed Command
- `npm run ingest:run`
- executed at: 2026-04-07 (Asia/Seoul)

## Actual Output
```json
{
  "result": {
    "crawled": 7,
    "merged": 7,
    "created": 7,
    "updated": 0,
    "failed": 0
  },
  "jobId": "crawl-edb79a94-cc73-4dfa-82a5-35c03225f142"
}
```

## Duplicate Candidate Sample
- primary: `event-oliveyoung-sale-spring`
- duplicate: `ingest-brand-oliveyoung-1775572289688`
- reason: `same-source-url`

## Notes
- Parser fallback can generate estimated events when page structure is unstable.
- Merge phase preserves source history and marks duplicate event as inactive.
