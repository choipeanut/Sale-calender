# Information Architecture

## Primary Navigation
- Home `/`
- Calendar `/calendar`
- Upcoming `/upcoming`
- Brand Settings `/settings/brands`
- Notification Settings `/settings/notifications`
- Admin `/admin`

## Key User Flows
1. Onboarding -> select favorite brands -> set notification rules -> view upcoming list.
2. Home -> event card -> detail page -> source validation.
3. Calendar -> filter/search -> open event detail.
4. Admin -> approve/update event -> merge duplicates -> rerun ingestion.

## Data Domains
- Catalog: brands, events, eventSources.
- Personalization: favoriteBrands, notificationPreferences.
- Operations: crawlJobs, notificationLogs.

## Access
- User APIs: authenticated identity (Firebase token or demo mode).
- Admin APIs: requires admin claim or bypass secret in non-prod.
