import { addDays, addMinutes, formatISO, isAfter, parseISO } from "date-fns";

import { getFirebaseAdminMessaging } from "@/lib/firebase/admin";
import { repository } from "@/lib/repositories/repository";
import type { EventRecord, NotificationPreference, NotificationType } from "@/lib/types";

const scheduleByType = (event: EventRecord, preference: NotificationPreference) => {
  if (!event.start_date) {
    return [] as Array<{ type: NotificationType; when: string }>;
  }

  const start = parseISO(`${event.start_date}T10:00:00+09:00`);
  const schedules: Array<{ type: NotificationType; when: string }> = [];

  if (preference.notify_7_days_before) {
    schedules.push({ type: "days_7", when: formatISO(addDays(start, -7)) });
  }

  if (preference.notify_1_day_before) {
    schedules.push({ type: "days_1", when: formatISO(addDays(start, -1)) });
  }

  if (preference.notify_on_start) {
    schedules.push({ type: "on_start", when: formatISO(start) });
  }

  if (preference.notify_custom_minutes_before && preference.notify_custom_minutes_before > 0) {
    schedules.push({
      type: "custom",
      when: formatISO(addMinutes(start, -preference.notify_custom_minutes_before)),
    });
  }

  return schedules;
};

export const buildNotificationQueue = async (userId: string) => {
  const [events, preferences, favorites] = await Promise.all([
    repository.listEvents({ user_id: userId }),
    repository.listNotificationPreferences(userId),
    repository.listFavorites(userId),
  ]);

  const favoriteIds = new Set(favorites.map((favorite) => favorite.brand_id));
  const activeEvents = events.filter((event) => event.status === "scheduled" && favoriteIds.has(event.brand_id));

  const globalPref =
    preferences.find((item) => !item.brand_id) ??
    ({
      id: "temp-global",
      user_id: userId,
      brand_id: null,
      notify_7_days_before: true,
      notify_1_day_before: true,
      notify_on_start: true,
      notify_custom_minutes_before: null,
      enabled: true,
      fcm_tokens: [],
    } satisfies NotificationPreference);

  const now = new Date();

  const queue: Array<{
    user_id: string;
    event_id: string;
    notification_type: NotificationType;
    scheduled_at: string;
    status: "scheduled" | "sent" | "failed" | "skipped";
    message?: string;
  }> = [];

  for (const event of activeEvents) {
    const pref = preferences.find((item) => item.brand_id === event.brand_id) ?? globalPref;

    if (!pref.enabled) {
      continue;
    }

    const schedules = scheduleByType(event, pref)
      .filter((schedule) => !isAfter(now, parseISO(schedule.when)))
      .slice(0, 4);

    schedules.forEach((schedule) => {
      queue.push({
        user_id: userId,
        event_id: event.id,
        notification_type: schedule.type,
        scheduled_at: schedule.when,
        status: "scheduled",
      });
    });
  }

  return { queue, tokens: globalPref.fcm_tokens ?? [] };
};

export const dispatchWebPush = async (tokens: string[], title: string, body: string) => {
  if (tokens.length === 0) {
    return { ok: false, sent: 0, reason: "no_tokens" as const };
  }

  const messaging = getFirebaseAdminMessaging();

  if (!messaging) {
    return { ok: true, sent: tokens.length, reason: "simulated" as const };
  }

  const message = {
    tokens,
    webpush: {
      notification: {
        title,
        body,
        icon: "/icons/icon-192.png",
      },
    },
  };

  const response = await messaging.sendEachForMulticast(message);

  return {
    ok: response.successCount > 0,
    sent: response.successCount,
    failed: response.failureCount,
    reason: "fcm",
  };
};
