import { formatISO } from "date-fns";

import { hasFirebaseServerConfig } from "@/lib/env";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { mockStore } from "@/lib/mock-store";
import { toEventStatus } from "@/lib/utils/date";
import type {
  Brand,
  CrawlJob,
  EventFilters,
  EventRecord,
  EventSource,
  FavoriteBrand,
  NotificationLog,
  NotificationPreference,
  PublicEventResponse,
} from "@/lib/types";

const shouldUseFirebase = () => hasFirebaseServerConfig && !!getFirebaseAdminDb();

const withComputedStatus = (event: EventRecord): EventRecord => ({
  ...event,
  status: toEventStatus(event),
});

const applyEventFilters = (events: EventRecord[], brands: Brand[], filters: EventFilters) => {
  const favorites = filters.user_id
    ? new Set(mockStore.getFavorites(filters.user_id).map((favorite) => favorite.brand_id))
    : new Set<string>();

  return events
    .map((event) => withComputedStatus(event))
    .filter((event) => event.status !== "inactive")
    .filter((event) => {
      if (!filters.brand) {
        return true;
      }

      return event.brand_id === filters.brand;
    })
    .filter((event) => {
      if (!filters.category) {
        return true;
      }

      const brand = brands.find((item) => item.id === event.brand_id);
      return brand?.category === filters.category;
    })
    .filter((event) => {
      if (!filters.month || !event.start_date) {
        return true;
      }

      return event.start_date.startsWith(filters.month);
    })
    .filter((event) => {
      if (!filters.status) {
        return true;
      }

      return event.status === filters.status;
    })
    .filter((event) => {
      if (!filters.q) {
        return true;
      }

      const q = filters.q.toLowerCase();
      const brand = brands.find((item) => item.id === event.brand_id);
      return event.title.toLowerCase().includes(q) || brand?.name.toLowerCase().includes(q);
    })
    .filter((event) => {
      if (!filters.favorite_only || !filters.user_id) {
        return true;
      }

      return favorites.has(event.brand_id);
    })
    .sort((a, b) => (a.start_date ?? "9999-99-99").localeCompare(b.start_date ?? "9999-99-99"));
};

export const repository = {
  async listBrands(): Promise<Brand[]> {
    if (!shouldUseFirebase()) {
      return mockStore.getBrands();
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.getBrands();
    }

    const snapshot = await db.collection("brands").where("is_active", "==", true).get();
    return snapshot.docs.map((doc) => doc.data() as Brand);
  },

  async listEvents(filters: EventFilters = {}): Promise<EventRecord[]> {
    if (!shouldUseFirebase()) {
      return mockStore.getEvents(filters);
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.getEvents(filters);
    }

    const [eventSnapshot, brands] = await Promise.all([db.collection("events").get(), this.listBrands()]);
    const events = eventSnapshot.docs.map((doc) => doc.data() as EventRecord);
    return applyEventFilters(events, brands, filters);
  },

  async getEventById(id: string): Promise<PublicEventResponse | null> {
    if (!shouldUseFirebase()) {
      const event = mockStore.getEventById(id);
      if (!event) {
        return null;
      }

      const brand = mockStore.findBrandById(event.brand_id);
      if (!brand) {
        return null;
      }

      const history = mockStore
        .getEvents({ brand: event.brand_id })
        .filter((item) => item.id !== event.id)
        .slice(-5)
        .map((item) => ({
          id: item.id,
          title: item.title,
          start_date: item.start_date,
          end_date: item.end_date,
          status: item.status,
        }));

      return {
        event,
        brand,
        similarHistory: history,
      };
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return null;
    }

    const eventDoc = await db.collection("events").doc(id).get();
    if (!eventDoc.exists) {
      return null;
    }

    const event = eventDoc.data() as EventRecord;
    const brandDoc = await db.collection("brands").doc(event.brand_id).get();
    if (!brandDoc.exists) {
      return null;
    }

    const historySnapshot = await db
      .collection("events")
      .where("brand_id", "==", event.brand_id)
      .where("id", "!=", event.id)
      .limit(5)
      .get();

    return {
      event: withComputedStatus(event),
      brand: brandDoc.data() as Brand,
      similarHistory: historySnapshot.docs.map((doc) => {
        const value = doc.data() as EventRecord;
        return {
          id: value.id,
          title: value.title,
          start_date: value.start_date,
          end_date: value.end_date,
          status: toEventStatus(value),
        };
      }),
    };
  },

  async listUpcoming(userId?: string) {
    if (!shouldUseFirebase()) {
      return mockStore.getUpcoming(userId);
    }

    const events = await this.listEvents({ user_id: userId, status: "scheduled" });
    return events.slice(0, 20);
  },

  async listFavorites(userId: string): Promise<FavoriteBrand[]> {
    if (!shouldUseFirebase()) {
      return mockStore.getFavorites(userId);
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.getFavorites(userId);
    }

    const snapshot = await db.collection("favoriteBrands").where("user_id", "==", userId).get();
    return snapshot.docs.map((doc) => doc.data() as FavoriteBrand);
  },

  async saveFavorites(userId: string, brandIds: string[]) {
    if (!shouldUseFirebase()) {
      return mockStore.setFavorites(userId, brandIds);
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.setFavorites(userId, brandIds);
    }

    const existing = await db.collection("favoriteBrands").where("user_id", "==", userId).get();
    const batch = db.batch();

    existing.docs.forEach((doc) => batch.delete(doc.ref));

    brandIds.forEach((brandId) => {
      const ref = db.collection("favoriteBrands").doc();
      batch.set(ref, {
        id: ref.id,
        user_id: userId,
        brand_id: brandId,
      });
    });

    await batch.commit();
    return this.listFavorites(userId);
  },

  async listNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
    if (!shouldUseFirebase()) {
      return mockStore.getNotificationPreferences(userId);
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.getNotificationPreferences(userId);
    }

    const snapshot = await db.collection("notificationPreferences").where("user_id", "==", userId).get();
    return snapshot.docs.map((doc) => doc.data() as NotificationPreference);
  },

  async saveNotificationPreferences(userId: string, payload: NotificationPreference[]) {
    if (!shouldUseFirebase()) {
      payload.forEach((item) => mockStore.upsertNotificationPreference(item));
      return mockStore.getNotificationPreferences(userId);
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      payload.forEach((item) => mockStore.upsertNotificationPreference(item));
      return mockStore.getNotificationPreferences(userId);
    }

    const batch = db.batch();
    payload.forEach((item) => {
      const ref = db.collection("notificationPreferences").doc(item.id);
      batch.set(ref, item, { merge: true });
    });

    await batch.commit();
    return this.listNotificationPreferences(userId);
  },

  async appendFcmToken(userId: string, token: string) {
    if (!shouldUseFirebase()) {
      return mockStore.appendFcmToken(userId, token);
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.appendFcmToken(userId, token);
    }

    const prefs = await this.listNotificationPreferences(userId);
    const globalPref = prefs.find((item) => !item.brand_id);

    if (!globalPref) {
      const created: NotificationPreference = {
        id: `pref-${crypto.randomUUID()}`,
        user_id: userId,
        brand_id: null,
        notify_7_days_before: true,
        notify_1_day_before: true,
        notify_on_start: true,
        notify_custom_minutes_before: null,
        enabled: true,
        fcm_tokens: [token],
      };

      await db.collection("notificationPreferences").doc(created.id).set(created);
      return created;
    }

    const fcm_tokens = Array.from(new Set([...(globalPref.fcm_tokens ?? []), token]));
    const next = { ...globalPref, fcm_tokens };
    await db.collection("notificationPreferences").doc(next.id).set(next, { merge: true });

    return next;
  },

  async createNotificationLog(payload: {
    user_id: string;
    event_id: string;
    notification_type: "days_7" | "days_1" | "on_start" | "custom";
    scheduled_at: string;
    status: "scheduled" | "sent" | "failed" | "skipped";
    message?: string;
  }) {
    if (!shouldUseFirebase()) {
      return mockStore.createNotificationLog({
        ...payload,
        sent_at: payload.status === "sent" ? formatISO(new Date()) : null,
      });
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.createNotificationLog({
        ...payload,
        sent_at: payload.status === "sent" ? formatISO(new Date()) : null,
      });
    }

    const ref = db.collection("notificationLogs").doc();
    const created = {
      id: ref.id,
      ...payload,
      sent_at: payload.status === "sent" ? formatISO(new Date()) : null,
    };

    await ref.set(created);
    return created;
  },

  async listNotificationLogs() {
    if (!shouldUseFirebase()) {
      return mockStore.getNotificationLogs();
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.getNotificationLogs();
    }

    const snapshot = await db.collection("notificationLogs").orderBy("scheduled_at", "desc").limit(200).get();
    return snapshot.docs.map((doc) => doc.data() as NotificationLog);
  },

  async listAdminEvents() {
    return this.listEvents();
  },

  async patchEvent(id: string, patch: Partial<EventRecord>) {
    if (!shouldUseFirebase()) {
      return mockStore.updateEvent(id, patch);
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.updateEvent(id, patch);
    }

    await db.collection("events").doc(id).set({ ...patch, updated_at: formatISO(new Date()) }, { merge: true });
    return (await db.collection("events").doc(id).get()).data() as EventRecord;
  },

  async createEvent(payload: Partial<EventRecord> & Pick<EventRecord, "brand_id" | "title" | "event_type">) {
    if (!shouldUseFirebase()) {
      return mockStore.createEvent(payload);
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.createEvent(payload);
    }

    const ref = db.collection("events").doc();
    const now = formatISO(new Date());
    const event: EventRecord = {
      id: ref.id,
      slug: payload.slug ?? payload.title.toLowerCase().replaceAll(" ", "-"),
      description: payload.description ?? "",
      start_date: payload.start_date ?? null,
      end_date: payload.end_date ?? null,
      date_precision: payload.date_precision ?? "tbd",
      is_estimated: payload.is_estimated ?? false,
      estimation_basis: payload.estimation_basis ?? null,
      recurrence_pattern: payload.recurrence_pattern ?? null,
      status: payload.status ?? "draft",
      confidence_score: payload.confidence_score ?? 0.5,
      verification_status: payload.verification_status ?? "pending",
      announcement_status: payload.announcement_status ?? "manual",
      last_verified_at: payload.last_verified_at ?? null,
      sources: payload.sources ?? [],
      admin_note: payload.admin_note ?? "",
      has_correction: payload.has_correction ?? false,
      created_at: now,
      updated_at: now,
      ...payload,
    };

    await ref.set(event);
    return event;
  },

  async mergeEvents(primaryId: string, duplicateId: string) {
    if (!shouldUseFirebase()) {
      return mockStore.mergeEvents(primaryId, duplicateId);
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.mergeEvents(primaryId, duplicateId);
    }

    const [primaryDoc, duplicateDoc] = await Promise.all([
      db.collection("events").doc(primaryId).get(),
      db.collection("events").doc(duplicateId).get(),
    ]);

    if (!primaryDoc.exists || !duplicateDoc.exists) {
      return null;
    }

    const primary = primaryDoc.data() as EventRecord;
    const duplicate = duplicateDoc.data() as EventRecord;

    const mergedSources = [...primary.sources, ...duplicate.sources].map((source: EventSource, index) => ({
      ...source,
      id: `${source.id}-merged-${index}`,
      event_id: primary.id,
    }));

    const batch = db.batch();
    batch.set(primaryDoc.ref, {
      sources: mergedSources,
      confidence_score: Math.max(primary.confidence_score, duplicate.confidence_score),
      updated_at: formatISO(new Date()),
    }, { merge: true });

    batch.set(duplicateDoc.ref, {
      status: "inactive",
      updated_at: formatISO(new Date()),
    }, { merge: true });

    await batch.commit();
    return (await db.collection("events").doc(primaryId).get()).data() as EventRecord;
  },

  async listCrawlJobs(): Promise<CrawlJob[]> {
    if (!shouldUseFirebase()) {
      return mockStore.getCrawlJobs();
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.getCrawlJobs();
    }

    const snapshot = await db.collection("crawlJobs").orderBy("started_at", "desc").limit(50).get();
    return snapshot.docs.map((doc) => doc.data() as CrawlJob);
  },

  async createCrawlJob(sourceTarget: string) {
    if (!shouldUseFirebase()) {
      return mockStore.createCrawlJob(sourceTarget);
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.createCrawlJob(sourceTarget);
    }

    const ref = db.collection("crawlJobs").doc();
    const crawlJob: CrawlJob = {
      id: ref.id,
      source_target: sourceTarget,
      started_at: formatISO(new Date()),
      finished_at: null,
      status: "running",
      items_found: 0,
      errors_count: 0,
      log_blob: "",
    };

    await ref.set(crawlJob);
    return crawlJob;
  },

  async finishCrawlJob(id: string, patch: Partial<CrawlJob>) {
    if (!shouldUseFirebase()) {
      return mockStore.finishCrawlJob(id, patch);
    }

    const db = getFirebaseAdminDb();
    if (!db) {
      return mockStore.finishCrawlJob(id, patch);
    }

    const ref = db.collection("crawlJobs").doc(id);
    await ref.set({
      ...patch,
      finished_at: patch.finished_at ?? formatISO(new Date()),
    }, { merge: true });

    const updated = await ref.get();
    return updated.data() as CrawlJob;
  },
};
