import { precisionLabel } from "@/lib/utils/date";
import type { EventRecord } from "@/lib/types";

import { StatusBadge } from "@/components/status-badge";

interface EventCardProps {
  event: EventRecord & {
    brand_name: string;
    category_label: string;
    date_label: string;
    precision_label: string;
    computed_status: EventRecord["status"];
    is_favorite_brand: boolean;
  };
  href?: string;
}

export const EventCard = ({ event, href }: EventCardProps) => {
  const Wrapper = href ? "a" : "div";

  return (
    <Wrapper
      {...(href ? { href } : {})}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{event.brand_name}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{event.title}</h3>
        </div>
        <StatusBadge status={event.computed_status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-900">{event.category_label}</span>
        <span className="rounded-full bg-sky-100 px-2 py-1 font-medium text-sky-900">{event.event_type}</span>
        <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
          {precisionLabel(event.date_precision, event.is_estimated)}
        </span>
        {event.is_favorite_brand ? (
          <span className="rounded-full bg-rose-100 px-2 py-1 font-medium text-rose-700">관심 브랜드</span>
        ) : null}
      </div>

      <p className="mt-3 text-sm text-slate-700">{event.date_label}</p>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{event.description || "행사 설명이 준비 중입니다."}</p>

      <div className="mt-3 text-xs text-slate-500">
        {event.sources.length > 0 ? `공식 출처 ${event.sources.length}건` : "출처 정보 없음"}
      </div>
    </Wrapper>
  );
};
