"use client";

import { useMemo, useState, useTransition } from "react";

import { eventStatusLabel } from "@/lib/utils/date";
import type { CrawlJob, EventRecord, NotificationLog } from "@/lib/types";

interface AdminPanelProps {
  events: EventRecord[];
  jobs: CrawlJob[];
  notificationLogs: NotificationLog[];
}

export const AdminPanel = ({ events, jobs, notificationLogs }: AdminPanelProps) => {
  const [selectedId, setSelectedId] = useState(events[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const selectedEvent = useMemo(() => events.find((item) => item.id === selectedId), [events, selectedId]);

  const runCrawl = () => {
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/admin/crawl-jobs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_target: "all:manual" }),
      });
      if (!response.ok) {
        setMessage("수집 실행 실패");
        return;
      }
      setMessage("수집 파이프라인이 실행되었습니다. 새로고침 후 결과를 확인하세요.");
    });
  };

  const approveSelected = () => {
    if (!selectedEvent) {
      return;
    }

    startTransition(async () => {
      setMessage("");
      const response = await fetch(`/api/admin/events/${selectedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: "verified", status: "scheduled", has_correction: true }),
      });

      if (!response.ok) {
        setMessage("이벤트 승인 실패");
        return;
      }

      setMessage("이벤트 상태를 승인(verified)으로 갱신했습니다.");
    });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">이벤트 검토</h3>
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:w-80"
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} ({eventStatusLabel(event.status)})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={approveSelected}
            disabled={pending || !selectedEvent}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            선택 이벤트 승인
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">수집 파이프라인</h3>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={runCrawl}
            disabled={pending}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
          >
            수집 재실행
          </button>
          <span className="text-sm text-slate-600">최근 실행 {jobs.length}건</span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">ID</th>
                <th className="py-2">대상</th>
                <th className="py-2">상태</th>
                <th className="py-2">수집 수</th>
              </tr>
            </thead>
            <tbody>
              {jobs.slice(0, 8).map((job) => (
                <tr key={job.id} className="border-t border-slate-100">
                  <td className="py-2">{job.id}</td>
                  <td className="py-2">{job.source_target}</td>
                  <td className="py-2">{job.status}</td>
                  <td className="py-2">{job.items_found}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">알림 발송 로그</h3>
        <div className="mt-3 space-y-2">
          {notificationLogs.slice(0, 10).map((log) => (
            <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-sm text-slate-700">
              <p className="font-medium">{log.event_id}</p>
              <p>
                {log.notification_type} / {log.status} / {log.scheduled_at}
              </p>
            </div>
          ))}
          {notificationLogs.length === 0 ? <p className="text-sm text-slate-500">기록 없음</p> : null}
        </div>
      </section>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
};
