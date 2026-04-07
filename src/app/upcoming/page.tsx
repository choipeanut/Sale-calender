import { EventCard } from "@/components/event-card";
import { repository } from "@/lib/repositories/repository";
import { formatDateRangeKR, toEventStatus } from "@/lib/utils/date";

export default async function UpcomingPage() {
  const [events, brands, favorites] = await Promise.all([
    repository.listUpcoming("demo-user"),
    repository.listBrands(),
    repository.listFavorites("demo-user"),
  ]);

  const favoriteSet = new Set(favorites.map((item) => item.brand_id));

  const rows = events.map((event) => {
    const brand = brands.find((item) => item.id === event.brand_id);
    return {
      ...event,
      brand_name: brand?.name ?? "브랜드",
      category_label: brand?.category ?? "기타",
      date_label: formatDateRangeKR(event.start_date, event.end_date),
      precision_label: event.date_precision,
      computed_status: toEventStatus(event),
      is_favorite_brand: favoriteSet.has(event.brand_id),
    };
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">다가오는 행사</h1>
      <p className="text-sm text-slate-600">관심 브랜드 기준으로 우선 노출됩니다.</p>

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((event) => (
          <EventCard key={event.id} event={event} href={`/events/${event.id}`} />
        ))}
      </div>

      {rows.length === 0 ? <p className="text-sm text-slate-500">현재 예정된 행사가 없습니다.</p> : null}
    </div>
  );
}
