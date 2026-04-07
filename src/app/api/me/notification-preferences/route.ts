import { z } from "zod";

import { requireIdentity } from "@/lib/auth";
import { badRequest, ok, serverError } from "@/lib/http";
import { repository } from "@/lib/repositories/repository";
import type { NotificationPreference } from "@/lib/types";

const itemSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  brand_id: z.string().nullable().optional(),
  notify_7_days_before: z.boolean(),
  notify_1_day_before: z.boolean(),
  notify_on_start: z.boolean(),
  notify_custom_minutes_before: z.number().nullable().optional(),
  enabled: z.boolean(),
  fcm_tokens: z.array(z.string()).optional(),
});

const payloadSchema = z.object({
  preferences: z.array(itemSchema),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireIdentity();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const preferences = await repository.listNotificationPreferences(auth.identity.userId);
    return ok({ preferences });
  } catch {
    return serverError();
  }
}

export async function PUT(request: Request) {
  const auth = await requireIdentity();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = await request.json();
    const validated = payloadSchema.safeParse(payload);

    if (!validated.success) {
      return badRequest(validated.error.issues[0]?.message ?? "invalid payload");
    }

    const sanitized = validated.data.preferences.map((item) => ({
      ...item,
      user_id: auth.identity.userId,
    })) as NotificationPreference[];

    const preferences = await repository.saveNotificationPreferences(auth.identity.userId, sanitized);
    return ok({ preferences });
  } catch {
    return serverError();
  }
}
