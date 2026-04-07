import { repository } from "@/lib/repositories/repository";
import { categoryLabel, formatDateRangeKR, precisionLabel, toEventStatus } from "@/lib/utils/date";
import type { CalendarEventView } from "@/lib/types";

const demoUserId = "demo-user";

export const getDashboardData = async () => {
  const [brands, events, favorites, preferences] = await Promise.all([
    repository.listBrands(),
    repository.listEvents({ user_id: demoUserId }),
    repository.listFavorites(demoUserId),
    repository.listNotificationPreferences(demoUserId),
  ]);

  const favoriteBrandIds = new Set(favorites.map((item) => item.brand_id));

  const upcoming = events.filter((event) => toEventStatus(event) === "scheduled").slice(0, 8);
  const ongoing = events.filter((event) => toEventStatus(event) === "ongoing").slice(0, 8);
  const favoriteEvents = events.filter((event) => favoriteBrandIds.has(event.brand_id)).slice(0, 8);

  return {
    brands,
    events,
    upcoming,
    ongoing,
    favoriteEvents,
    favorites,
    preferences,
    favoriteBrandIds,
  };
};

export const buildCalendarEvents = async (): Promise<CalendarEventView[]> => {
  const [events, brands, favorites] = await Promise.all([
    repository.listEvents({ user_id: demoUserId }),
    repository.listBrands(),
    repository.listFavorites(demoUserId),
  ]);

  const favoriteSet = new Set(favorites.map((item) => item.brand_id));

  return events
    .filter((event) => event.start_date)
    .map((event) => {
      const brand = brands.find((item) => item.id === event.brand_id);
      return {
        id: event.id,
        title: `${brand?.name ?? "브랜드"} · ${event.title}`,
        start: event.start_date ?? undefined,
        end: event.end_date ?? event.start_date ?? undefined,
        allDay: true,
        extendedProps: {
          eventType: event.event_type,
          category: brand?.category ?? "fashion",
          brandName: brand?.name ?? "브랜드",
          status: toEventStatus(event),
          isEstimated: event.is_estimated,
          datePrecision: event.date_precision,
          hasSource: event.sources.length > 0,
          isFavoriteBrand: favoriteSet.has(event.brand_id),
        },
      };
    });
};

export const enrichEventList = async () => {
  const [events, brands, favorites] = await Promise.all([
    repository.listEvents({ user_id: demoUserId }),
    repository.listBrands(),
    repository.listFavorites(demoUserId),
  ]);

  const favoriteSet = new Set(favorites.map((item) => item.brand_id));

  return events.map((event) => {
    const brand = brands.find((item) => item.id === event.brand_id);
    return {
      ...event,
      brand_name: brand?.name ?? "브랜드",
      category_label: categoryLabel(brand?.category ?? "fashion"),
      date_label: formatDateRangeKR(event.start_date, event.end_date),
      precision_label: precisionLabel(event.date_precision, event.is_estimated),
      computed_status: toEventStatus(event),
      is_favorite_brand: favoriteSet.has(event.brand_id),
    };
  });
};

export const getDemoUserId = () => demoUserId;
