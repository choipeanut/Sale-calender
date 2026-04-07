"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import { useRouter } from "next/navigation";

import { getStatusColor } from "@/lib/utils/date";
import type { CalendarEventView } from "@/lib/types";

interface CalendarViewProps {
  events: CalendarEventView[];
}

export const CalendarView = ({ events }: CalendarViewProps) => {
  const router = useRouter();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:p-5">
      <FullCalendar
        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ko"
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,listWeek",
        }}
        events={events}
        eventDidMount={(info) => {
          const color = getStatusColor(info.event.extendedProps.status);
          info.el.style.backgroundColor = color;
          info.el.style.borderColor = color;
        }}
        eventClick={(info) => {
          router.push(`/events/${info.event.id}`);
        }}
      />
    </div>
  );
};
