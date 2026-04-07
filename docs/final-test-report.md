# Final Test Report

## Command Results (2026-04-07, Asia/Seoul)
- `npm run lint` ✅ pass
- `npm run typecheck` ✅ pass
- `npm run test` ✅ pass (2 files, 3 tests)
- `npm run test:e2e` ✅ pass (4 tests)
- `npm run artifact:screenshots` ✅ pass (2 tests)
- `npm run ingest:run` ✅ pass
- `cd android && gradlew.bat assembleDebug` ✅ pass (APK 생성)

## Unit Coverage Snapshot
- statements: 66.3%
- branches: 45.76%
- functions: 56.25%
- lines: 65.9%

## E2E Scope Summary
1. Onboarding and favorite brand selection.
2. Calendar visibility and detail navigation.
3. Notification preference save.
4. Admin event approval action and re-check.

## Artifacts
- Browser validation: `docs/browser-validation-record.md`
- Screenshots: `docs/phase-1-screenshots/*`
- Ingestion log: `docs/ingestion-sample-log.md`
- Notification simulation: `docs/notification-simulation.md`
- APK artifact: `artifacts/android/sale-calendar-debug.apk`
- APK runtime check: app boots into multi-tab interactive UI (not splash-only)
