import { z } from "zod";

import { requireAdminIdentity } from "@/lib/auth";
import { badRequest, ok, serverError } from "@/lib/http";
import { buildNotificationQueue, dispatchWebPush } from "@/lib/notifications/scheduler";
import { repository } from "@/lib/repositories/repository";

const payloadSchema = z.object({
  user_id: z.string().default("demo-user"),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminIdentity();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const validated = payloadSchema.safeParse(body);

    if (!validated.success) {
      return badRequest(validated.error.issues[0]?.message ?? "invalid payload");
    }

    const { queue, tokens } = await buildNotificationQueue(validated.data.user_id);

    if (queue.length === 0) {
      return ok({ queued: 0, sent: 0, reason: "no_schedules" });
    }

    let sent = 0;

    for (const item of queue) {
      const message = `이벤트 ${item.event_id} 알림 (${item.notification_type})`;

      const created = await repository.createNotificationLog({
        ...item,
        status: "scheduled",
      });

      const dispatched = await dispatchWebPush(tokens, "Sale Calendar", message);
      const status = dispatched.ok ? "sent" : "failed";
      if (status === "sent") {
        sent += 1;
      }

      await repository.createNotificationLog({
        user_id: item.user_id,
        event_id: item.event_id,
        notification_type: item.notification_type,
        scheduled_at: item.scheduled_at,
        status,
        message: `${dispatched.reason}:${created.id}`,
      });
    }

    return ok({ queued: queue.length, sent, mode: tokens.length > 0 ? "push" : "simulated" });
  } catch {
    return serverError();
  }
}
