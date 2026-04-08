# Sale Calendar

국내 주요 할인 행사를 통합해서 보여주는 모바일 우선 PWA 앱입니다.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Firebase (Auth + Firestore + Cloud Messaging) with demo fallback
- FullCalendar for monthly/list views
- Playwright + Vitest test suites

## Core Features
- 월간 캘린더 / 리스트 / 다가오는 행사
- 브랜드/카테고리/상태/검색 필터
- 관심 브랜드 저장
- 알림 설정 (7일 전, 1일 전, 당일, 커스텀)
- 행사 상세: 공식 링크, 검증 시각, 출처 목록, 예상 일정 표시
- 관리자: 이벤트 승인/수정/병합, 수집 실행, 로그 확인
- 수집 파이프라인: source registry, parser, dedupe, change detection

## Quick Start
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Useful Scripts
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run artifact:screenshots`
- `npm run ingest:run`

## Android APK
- Generated debug APK path: `artifacts/android/sale-calendar-debug.apk`
- Latest debug APK version: `1.0.1` (`versionCode 2`, built on 2026-04-08)
- Current APK includes offline demo flows:
  - Home / Calendar / Upcoming tabs
  - Favorite brand save
  - Notification preference save + simulation
  - Admin edit + dedupe simulation
- Install via USB debugging:
```bash
adb install -r artifacts/android/sale-calendar-debug.apk
```
- Rebuild APK:
```bash
npm install
npx cap sync android
cd android
./gradlew assembleDebug
```

## Required Artifacts
- `requirements.md`
- `information-architecture.md`
- `data-model.md`
- `ingestion-strategy.md`
- `implementation-plan.md`
- `test-plan.md`
- `docs/*`

## Notes
- 기본 동작은 `NEXT_PUBLIC_DEMO_MODE=true`의 인메모리 저장소입니다.
- 실제 Firebase 연동 시 `.env.local`에 서비스 계정/클라이언트 키를 채워주세요.
