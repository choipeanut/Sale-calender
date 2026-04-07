import { format, parseISO, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";

import type { DatePrecision, EventRecord, EventStatus } from "@/lib/types";

export const toDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return parseISO(value);
  } catch {
    return null;
  }
};

export const toEventStatus = (event: Pick<EventRecord, "start_date" | "end_date" | "status">): EventStatus => {
  if (["inactive", "draft", "hold"].includes(event.status)) {
    return event.status;
  }

  const today = startOfDay(new Date());
  const start = toDate(event.start_date);

  if (!start) {
    return "scheduled";
  }

  const end = toDate(event.end_date) ?? start;

  if (today > end) {
    return "ended";
  }

  if (today >= start && today <= end) {
    return "ongoing";
  }

  return "scheduled";
};

export const formatDateKR = (value?: string | null) => {
  const date = toDate(value);
  if (!date) {
    return "미정";
  }

  return format(date, "yyyy.MM.dd", { locale: ko });
};

export const formatDateRangeKR = (start?: string | null, end?: string | null) => {
  if (!start && !end) {
    return "일정 미정";
  }

  if (start && !end) {
    return `${formatDateKR(start)} ~`;
  }

  if (!start && end) {
    return `~ ${formatDateKR(end)}`;
  }

  if (start === end) {
    return formatDateKR(start);
  }

  return `${formatDateKR(start)} ~ ${formatDateKR(end)}`;
};

export const eventStatusLabel = (status: EventStatus) => {
  const map: Record<EventStatus, string> = {
    scheduled: "예정",
    ongoing: "진행중",
    ended: "종료",
    draft: "보류",
    hold: "검토중",
    inactive: "비활성화",
  };

  return map[status];
};

export const precisionLabel = (precision: DatePrecision, isEstimated: boolean) => {
  if (precision === "tbd") {
    return "미정";
  }

  if (precision === "month") {
    return "월 단위";
  }

  if (precision === "estimated" || isEstimated) {
    return "예상 일정";
  }

  return "확정";
};

export const categoryLabel = (category: string) => {
  const map: Record<string, string> = {
    beauty: "뷰티",
    fashion: "패션",
    spa: "SPA",
    mall: "종합몰",
    national: "전국 행사",
  };

  return map[category] ?? category;
};

export const getStatusColor = (status: EventStatus) => {
  const map: Record<EventStatus, string> = {
    scheduled: "var(--status-scheduled)",
    ongoing: "var(--status-ongoing)",
    ended: "var(--status-ended)",
    draft: "#947f2d",
    hold: "#7a4a2d",
    inactive: "#6f6f6f",
  };

  return map[status];
};
