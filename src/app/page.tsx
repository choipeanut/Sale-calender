import Link from "next/link";

import { EventCard } from "@/components/event-card";
import { getDashboardData, getDemoUserId } from "@/lib/services";
import { formatDateRangeKR, toEventStatus } from "@/lib/utils/date";

export default async function HomePage() {
  const { upcoming, ongoing, favoriteEvents, events } = await getDashboardData();

  const thisMonth = events
    .filter((event) => event.start_date)
    .slice(0, 10)
    .map((event) => ({
      ...event,
      brand_name: event.brand_id.replace("brand-", "").toUpperCase(),
      category_label: "행사",
      date_label: formatDateRangeKR(event.start_date, event.end_date),
      precision_label: event.date_precision,
      computed_status: toEventStatus(event),
      is_favorite_brand: favoriteEvents.some((item) => item.id === event.id),
    }));

  const block = [
    {
      title: "곧 시작하는 행사",
      href: "/upcoming",
      items: upcoming,
      empty: "예정 행사가 없습니다.",
    },
    {
      title: "진행 중인 행사",
      href: "/calendar?status=ongoing",
      items: ongoing,
      empty: "진행 중인 행사가 없습니다.",
    },
    {
      title: "관심 브랜드 행사",
      href: "/settings/brands",
      items: favoriteEvents,
      empty: "관심 브랜드를 먼저 선택해 주세요.",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.16em] text-white/85">Mobile-first PWA</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">할인 시즌 놓치지 않는 쇼핑 캘린더</h1>
        <p className="mt-3 text-sm text-white/90 md:text-base">
          관심 브랜드를 선택하면 시작 7일 전/1일 전/당일 알림을 받을 수 있습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/onboarding" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-700">
            온보딩 시작
          </Link>
          <Link href="/calendar" className="rounded-full border border-white/50 px-4 py-2 text-sm font-semibold text-white">
            캘린더 보기
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {block.map((section) => (
          <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <Link href={section.href} className="text-xs font-semibold text-slate-500">
                전체보기
              </Link>
            </div>
            <div className="space-y-2">
              {section.items.length === 0 ? <p className="text-sm text-slate-500">{section.empty}</p> : null}
              {section.items.slice(0, 3).map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700"
                >
                  <p className="font-semibold">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateRangeKR(event.start_date, event.end_date)}</p>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">이번 달 주요 행사</h2>
          <span className="text-xs text-slate-500">사용자: {getDemoUserId()}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {thisMonth.map((event) => (
            <EventCard key={event.id} event={event} href={`/events/${event.id}`} />
          ))}
        </div>
      </section>
    </div>
  );
}
