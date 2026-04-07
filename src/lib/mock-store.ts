import { addDays, formatISO, isAfter, isBefore, parseISO } from "date-fns";

import {
  seedBrands,
  seedCrawlJobs,
  seedEvents,
  seedFavoriteBrands,
  seedNotificationLogs,
  seedNotificationPreferences,
  seedUsers,
} from "@/lib/data/seed";
import type {
  Brand,
  CrawlJob,
  EventFilters,
  EventRecord,
  FavoriteBrand,
  NotificationLog,
  NotificationPreference,
  UserProfile,
} from "@/lib/types";

interface DatabaseState {
  brands: Brand[];
  events: EventRecord[];
  users: UserProfile[];
  favoriteBrands: FavoriteBrand[];
  notificationPreferences: NotificationPreference[];
  notificationLogs: NotificationLog[];
  crawlJobs: CrawlJob[];
}

const globalStore = globalThis as unknown as { __SALE_CALENDAR_DB__?: DatabaseState };

const todayDateString = () => formatISO(new Date(), { representation: "date" });

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const initialState = (): DatabaseState => ({
  brands: clone(seedBrands),
  events: clone(seedEvents),
  users: clone(seedUsers),
  favoriteBrands: clone(seedFavoriteBrands),
  notificationPreferences: clone(seedNotificationPreferences),
  notificationLogs: clone(seedNotificationLogs),
  crawlJobs: clone(seedCrawlJobs),
});

const getState = (): DatabaseState => {
  if (!globalStore.__SALE_CALENDAR_DB__) {
    globalStore.__SALE_CALENDAR_DB__ = initialState();
  }

  return globalStore.__SALE_CALENDAR_DB__;
};

const scoreStatus = (event: EventRecord): EventRecord["status"] => {
  if (!event.start_date) {
    return "scheduled";
  }

  const today = parseISO(todayDateString());
  const start = parseISO(event.start_date);
  const end = event.end_date ? parseISO(event.end_date) : start;

  if (isAfter(today, end)) {
    return "ended";
  }

  if (!isBefore(today, start) && !isAfter(today, end)) {
    return "ongoing";
  }

  return "scheduled";
};

const normalizeEventStatuses = (events: EventRecord[]): EventRecord[] =>
  events.map((event) => ({
    ...event,
    status: event.status === "inactive" || event.status === "draft" || event.status === "hold" ? event.status : scoreStatus(event),
  }));

const filterByStatus = (event: EventRecord, status?: EventFilters["status"]) => {
  if (!status) {
    return true;
  }

  return event.status === status;
};

export const mockStore = {
  getBrands() {
    return clone(getState().brands.filter((brand) => brand.is_active));
  },

  findBrandById(id: string) {
    return clone(getState().brands.find((brand) => brand.id === id) ?? null);
  },

  createBrand(payload: Pick<Brand, "name" | "slug" | "category" | "official_site_url">) {
    const state = getState();
    const brand: Brand = {
      id: `brand-${crypto.randomUUID()}`,
      logo_url: "",
      is_active: true,
      ...payload,
    };

    state.brands.push(brand);
    return clone(brand);
  },

  getEvents(filters: EventFilters = {}) {
    const state = getState();
    const userFavorites = filters.user_id
      ? new Set(
          state.favoriteBrands
            .filter((favorite) => favorite.user_id === filters.user_id)
            .map((favorite) => favorite.brand_id),
        )
      : new Set<string>();

    const normalized = normalizeEventStatuses(state.events)
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

        const brand = state.brands.find((item) => item.id === event.brand_id);
        return brand?.category === filters.category;
      })
      .filter((event) => {
        if (!filters.month || !event.start_date) {
          return true;
        }

        return event.start_date.startsWith(filters.month);
      })
      .filter((event) => filterByStatus(event, filters.status))
      .filter((event) => {
        if (!filters.q) {
          return true;
        }

        const q = filters.q.toLowerCase();
        const brandName = state.brands.find((brand) => brand.id === event.brand_id)?.name.toLowerCase() ?? "";
        return event.title.toLowerCase().includes(q) || brandName.includes(q);
      })
      .filter((event) => {
        if (!filters.favorite_only || !filters.user_id) {
          return true;
        }

        return userFavorites.has(event.brand_id);
      })
      .sort((a, b) => (a.start_date ?? "9999-99-99").localeCompare(b.start_date ?? "9999-99-99"));

    return clone(normalized);
  },

  getEventById(id: string) {
    const state = getState();
    const event = state.events.find((item) => item.id === id);

    if (!event) {
      return null;
    }

    return clone({
      ...event,
      status: scoreStatus(event),
    });
  },

  createEvent(payload: Partial<EventRecord> & Pick<EventRecord, "brand_id" | "title" | "event_type">) {
    const state = getState();
    const now = formatISO(new Date());
    const id = `event-${crypto.randomUUID()}`;
    const event: EventRecord = {
      id,
      slug: payload.slug ?? `${payload.title.toLowerCase().replaceAll(" ", "-")}-${Date.now()}`,
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

    state.events.push(event);
    return clone(event);
  },

  updateEvent(id: string, patch: Partial<EventRecord>) {
    const state = getState();
    const index = state.events.findIndex((event) => event.id === id);

    if (index < 0) {
      return null;
    }

    const nextValue = {
      ...state.events[index],
      ...patch,
      updated_at: formatISO(new Date()),
    };

    state.events[index] = nextValue;
    return clone(nextValue);
  },

  mergeEvents(primaryId: string, duplicateId: string) {
    const state = getState();
    const primary = state.events.find((event) => event.id === primaryId);
    const duplicate = state.events.find((event) => event.id === duplicateId);

    if (!primary || !duplicate) {
      return null;
    }

    primary.sources = [...primary.sources, ...duplicate.sources].map((source, index) => ({
      ...source,
      id: `${source.id}-m${index}`,
      event_id: primary.id,
    }));
    primary.confidence_score = Math.max(primary.confidence_score, duplicate.confidence_score);
    primary.updated_at = formatISO(new Date());
    duplicate.status = "inactive";
    duplicate.updated_at = formatISO(new Date());

    return clone(primary);
  },

  getUpcoming(userId?: string) {
    const events = this.getEvents({ user_id: userId });
    return events
      .filter((event) => event.status === "scheduled")
      .filter((event) => !!event.start_date)
      .slice(0, 20);
  },

  getFavorites(userId: string) {
    const state = getState();
    return clone(state.favoriteBrands.filter((favorite) => favorite.user_id === userId));
  },

  setFavorites(userId: string, brandIds: string[]) {
    const state = getState();
    state.favoriteBrands = state.favoriteBrands.filter((favorite) => favorite.user_id !== userId);

    const next = brandIds.map((brandId) => ({
      id: `fav-${crypto.randomUUID()}`,
      user_id: userId,
      brand_id: brandId,
    }));

    state.favoriteBrands.push(...next);
    return clone(next);
  },

  getNotificationPreferences(userId: string) {
    const state = getState();
    return clone(state.notificationPreferences.filter((preference) => preference.user_id === userId));
  },

  upsertNotificationPreference(payload: NotificationPreference) {
    const state = getState();
    const index = state.notificationPreferences.findIndex((item) => item.id === payload.id);

    if (index >= 0) {
      state.notificationPreferences[index] = payload;
    } else {
      state.notificationPreferences.push(payload);
    }

    return clone(payload);
  },

  appendFcmToken(userId: string, token: string) {
    const state = getState();
    const pref = state.notificationPreferences.find(
      (item) => item.user_id === userId && (item.brand_id === null || item.brand_id === undefined),
    );

    if (!pref) {
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
      state.notificationPreferences.push(created);
      return clone(created);
    }

    pref.fcm_tokens = Array.from(new Set([...(pref.fcm_tokens ?? []), token]));
    return clone(pref);
  },

  getNotificationLogs() {
    return clone(getState().notificationLogs);
  },

  createNotificationLog(log: Omit<NotificationLog, "id">) {
    const state = getState();
    const created = { ...log, id: `noti-${crypto.randomUUID()}` };
    state.notificationLogs.push(created);
    return clone(created);
  },

  markNotificationSent(id: string, status: NotificationLog["status"], message?: string) {
    const state = getState();
    const index = state.notificationLogs.findIndex((log) => log.id === id);

    if (index < 0) {
      return null;
    }

    state.notificationLogs[index] = {
      ...state.notificationLogs[index],
      status,
      message,
      sent_at: status === "sent" ? formatISO(new Date()) : state.notificationLogs[index].sent_at,
    };

    return clone(state.notificationLogs[index]);
  },

  createCrawlJob(sourceTarget: string): CrawlJob {
    const state = getState();
    const job: CrawlJob = {
      id: `crawl-${crypto.randomUUID()}`,
      source_target: sourceTarget,
      started_at: formatISO(new Date()),
      finished_at: null,
      status: "running",
      items_found: 0,
      errors_count: 0,
      log_blob: "",
    };

    state.crawlJobs.unshift(job);
    return clone(job);
  },

  finishCrawlJob(id: string, patch: Partial<CrawlJob>) {
    const state = getState();
    const index = state.crawlJobs.findIndex((job) => job.id === id);
    if (index < 0) {
      return null;
    }

    state.crawlJobs[index] = {
      ...state.crawlJobs[index],
      ...patch,
      finished_at: patch.finished_at ?? formatISO(new Date()),
    };
    return clone(state.crawlJobs[index]);
  },

  getCrawlJobs() {
    return clone(getState().crawlJobs);
  },

  getUserById(userId: string) {
    return clone(getState().users.find((user) => user.id === userId) ?? null);
  },

  ensureDemoDataFreshness() {
    const state = getState();
    if (!state.events.some((event) => event.start_date)) {
      return;
    }

    const shouldRollForward = state.events.every((event) => {
      if (!event.start_date) {
        return true;
      }

      return isBefore(parseISO(event.start_date), addDays(new Date(), -365));
    });

    if (!shouldRollForward) {
      return;
    }

    state.events = state.events.map((event, index) => {
      const start = event.start_date ? addDays(new Date(), index + 1) : null;
      const end = event.end_date ? addDays(start ?? new Date(), 3) : null;
      return {
        ...event,
        start_date: start ? formatISO(start, { representation: "date" }) : event.start_date,
        end_date: end ? formatISO(end, { representation: "date" }) : event.end_date,
      };
    });
  },
};

mockStore.ensureDemoDataFreshness();
