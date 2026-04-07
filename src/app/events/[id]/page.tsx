import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { repository } from "@/lib/repositories/repository";
import { formatDateRangeKR, precisionLabel, toEventStatus } from "@/lib/utils/date";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const payload = await repository.getEventById(id);

  if (!payload) {
    notFound();
  }

  const { event, brand, similarHistory } = payload;
  const status = toEventStatus(event);

  return (
    <div className="space-y-4">
      <Link href="/calendar" className="text-sm font-semibold text-slate-600">
        ← 캘린더로 돌아가기
      </Link>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">{brand.name}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{event.title}</h1>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p>
            <strong>행사 유형:</strong> {event.event_type}
          </p>
          <p>
            <strong>기간:</strong> {formatDateRangeKR(event.start_date, event.end_date)}
          </p>
          <p>
            <strong>반복 주기:</strong> {event.recurrence_pattern ?? "미정"}
          </p>
          <p>
            <strong>정확도:</strong> {precisionLabel(event.date_precision, event.is_estimated)}
          </p>
          <p>
            <strong>공식 확정 상태:</strong> {event.announcement_status}
          </p>
          <p>
            <strong>마지막 검증 시각:</strong> {event.last_verified_at ?? "기록 없음"}
          </p>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <p>{event.description || "설명이 아직 등록되지 않았습니다."}</p>
          {event.is_estimated ? (
            <p className="mt-2 text-amber-700">
              예상 일정: {event.estimation_basis ?? "과거 패턴 기반 추정"}
            </p>
          ) : (
            <p className="mt-2 text-emerald-700">공식 공지 기반으로 확인된 일정입니다.</p>
          )}
          {event.admin_note ? <p className="mt-2 text-slate-600">운영자 메모: {event.admin_note}</p> : null}
        </div>
      </article>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">출처 목록</h2>
        <div className="mt-3 space-y-2">
          {event.sources.map((source) => (
            <a
              key={source.id}
              href={source.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <p className="font-medium text-slate-800">{source.source_title}</p>
              <p className="mt-1 text-xs text-slate-600">{source.source_type}</p>
              <p className="mt-1 text-xs text-slate-500">수집 시각: {source.collected_at}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">유사 이전 행사</h2>
        <ul className="mt-3 space-y-2">
          {similarHistory.map((history) => (
            <li key={history.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium">{history.title}</p>
              <p>{formatDateRangeKR(history.start_date, history.end_date)}</p>
              <p className="text-xs text-slate-500">상태: {history.status}</p>
            </li>
          ))}
          {similarHistory.length === 0 ? <li className="text-sm text-slate-500">이전 히스토리가 없습니다.</li> : null}
        </ul>
      </section>
    </div>
  );
}
