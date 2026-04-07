# Ingestion Strategy

## Source Trust Priority
1. official event pages
2. official newsroom/press
3. official app/web notices
4. trusted media articles
5. manual operator input

## Pipeline
1. Read active source registry entries.
2. Fetch public pages with safe user-agent and timeout.
3. Parse candidate event text/date windows.
4. Convert to normalized event records with source metadata.
5. Upsert changes into canonical event set.
6. Detect duplicates (brand + title similarity + date proximity/source URL).
7. Merge duplicates and keep multi-source history.
8. Persist crawl job logs and errors.

## Scheduling
- Daily baseline run.
- Pre-season run every 6 hours (triggered by scheduler).
- Manual run from admin dashboard.

## Safety
- No login-required pages.
- Respect robots/terms and rate limiting.
- Log failures and keep partial run metadata.
