# Implementation Summary

## What Was Built
- Next.js + TypeScript + Tailwind mobile-first PWA shell.
- Home, monthly calendar, list/upcoming, event detail, onboarding, settings, admin pages.
- API layer for events/brands/favorites/notification preferences/admin operations.
- Ingestion pipeline with source parsing, dedupe, merge, and crawl job logs.
- Notification queue scheduler and web push dispatch abstraction (FCM + simulated fallback).

## Architecture Choices
- Repository abstraction switches between Firestore and in-memory demo store.
- Shared type model (`src/lib/types.ts`) for UI/API/ingestion consistency.
- Admin guard via Firebase token claim (with local bypass/demo support).

## MVP Outcomes
- Brand/event data is DB-model based (not hardcoded UI-only).
- Favorites and notification settings are persisted through APIs.
- Admin can review/update events and rerun ingestion.
- Source links, verification status, and estimated schedule labels are shown in detail UI.
