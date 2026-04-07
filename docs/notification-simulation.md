# Notification Simulation

## Executed Command
```bash
npx tsx -e "import { repository } from './src/lib/repositories/repository'; import { buildNotificationQueue, dispatchWebPush } from './src/lib/notifications/scheduler'; ..."
```

## Actual Result
```json
{
  "queued": 4,
  "tokens": 1,
  "dispatch": {
    "ok": true,
    "sent": 1,
    "reason": "simulated"
  }
}
```

## Interpretation
- Queue generation from favorite brands + preference rules works.
- With no Firebase Admin messaging config, dispatch runs in simulation mode.
- Notification logs are still recorded for admin audit flow.
