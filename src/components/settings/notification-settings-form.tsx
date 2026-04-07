"use client";

import { useState, useTransition } from "react";

import type { NotificationPreference } from "@/lib/types";

interface NotificationSettingsFormProps {
  preferences: NotificationPreference[];
}

const ensureGlobal = (preferences: NotificationPreference[]) =>
  preferences.find((item) => !item.brand_id) ?? {
    id: "pref-global-demo",
    user_id: "demo-user",
    brand_id: null,
    notify_7_days_before: true,
    notify_1_day_before: true,
    notify_on_start: true,
    notify_custom_minutes_before: 120,
    enabled: true,
    fcm_tokens: [],
  };

export const NotificationSettingsForm = ({ preferences }: NotificationSettingsFormProps) => {
  const [globalPref, setGlobalPref] = useState<NotificationPreference>(ensureGlobal(preferences));
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const update = <K extends keyof NotificationPreference>(key: K, value: NotificationPreference[K]) => {
    setGlobalPref((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/me/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: [globalPref] }),
      });

      if (!response.ok) {
        setMessage("알림 설정 저장 실패");
        return;
      }

      setMessage("알림 설정이 저장되었습니다.");
    });
  };

  const simulate = () => {
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/admin/notifications/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: globalPref.user_id }),
      });

      if (!response.ok) {
        setMessage("알림 시뮬레이션 실패");
        return;
      }

      const payload = (await response.json()) as { queued: number; sent: number; mode: string };
      setMessage(`시뮬레이션 완료: queued=${payload.queued}, sent=${payload.sent}, mode=${payload.mode}`);
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">전체 알림 사용</span>
        <input
          type="checkbox"
          checked={globalPref.enabled}
          onChange={(event) => update("enabled", event.target.checked)}
          className="h-5 w-5"
        />
      </label>

      <label className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-700">행사 시작 7일 전</span>
        <input
          type="checkbox"
          checked={globalPref.notify_7_days_before}
          onChange={(event) => update("notify_7_days_before", event.target.checked)}
          className="h-5 w-5"
        />
      </label>

      <label className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-700">행사 시작 1일 전</span>
        <input
          type="checkbox"
          checked={globalPref.notify_1_day_before}
          onChange={(event) => update("notify_1_day_before", event.target.checked)}
          className="h-5 w-5"
        />
      </label>

      <label className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-700">행사 시작 당일</span>
        <input
          type="checkbox"
          checked={globalPref.notify_on_start}
          onChange={(event) => update("notify_on_start", event.target.checked)}
          className="h-5 w-5"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-slate-700">커스텀 알림 (분 전)</span>
        <input
          type="number"
          value={globalPref.notify_custom_minutes_before ?? 0}
          onChange={(event) =>
            update("notify_custom_minutes_before", Number.isNaN(Number(event.target.value)) ? null : Number(event.target.value))
          }
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "저장 중..." : "알림 설정 저장"}
        </button>

        <button
          type="button"
          onClick={simulate}
          disabled={pending}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          알림 시뮬레이션
        </button>
      </div>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
};
