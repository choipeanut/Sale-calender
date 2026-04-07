import { CalendarView } from "@/components/calendar/calendar-view";
import { FilterBar } from "@/components/calendar/filter-bar";
import { EventCard } from "@/components/event-card";
import { repository } from "@/lib/repositories/repository";
import { buildCalendarEvents, enrichEventList, getDemoUserId } from "@/lib/services";

interface CalendarPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const [params, brands, calendarEvents] = await Promise.all([
    searchParams,
    repository.listBrands(),
    buildCalendarEvents(),
  ]);

  const filters = {
    brand: typeof params.brand === "string" ? params.brand : undefined,
    category: typeof params.category === "string" ? params.category : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    q: typeof params.q === "string" ? params.q : undefined,
    favorite_only: params.favorite_only === "true",
    user_id: getDemoUserId(),
  };

  const rows = (await enrichEventList()).filter((event) => {
    if (filters.brand && event.brand_id !== filters.brand) {
      return false;
    }

    if (filters.category) {
      const brand = brands.find((item) => item.id === event.brand_id);
      if (brand?.category !== filters.category) {
        return false;
      }
    }

    if (filters.status && event.computed_status !== filters.status) {
      return false;
    }

    if (filters.favorite_only && !event.is_favorite_brand) {
      return false;
    }

    if (filters.q) {
      const q = filters.q.toLowerCase();
      if (!event.title.toLowerCase().includes(q) && !event.brand_name.toLowerCase().includes(q)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">월간 캘린더</h1>
      <FilterBar brands={brands} />
      <CalendarView events={calendarEvents} />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">리스트 보기</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((event) => (
            <EventCard key={event.id} event={event} href={`/events/${event.id}`} />
          ))}
        </div>
      </section>
    </div>
  );
}
