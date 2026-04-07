import { eventStatusLabel, getStatusColor } from "@/lib/utils/date";
import type { EventStatus } from "@/lib/types";

export const StatusBadge = ({ status }: { status: EventStatus }) => {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white"
      style={{ backgroundColor: getStatusColor(status) }}
    >
      {eventStatusLabel(status)}
    </span>
  );
};
