import { z } from "zod";

import { requireAdminIdentity } from "@/lib/auth";
import { badRequest, ok, serverError } from "@/lib/http";
import { repository } from "@/lib/repositories/repository";

const createSchema = z.object({
  brand_id: z.string(),
  title: z.string().min(2),
  event_type: z.string().min(2),
  description: z.string().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  date_precision: z.enum(["day", "month", "estimated", "tbd"]).optional(),
  is_estimated: z.boolean().optional(),
  estimation_basis: z.string().nullable().optional(),
  status: z.enum(["scheduled", "ongoing", "ended", "draft", "hold", "inactive"]).optional(),
  verification_status: z.enum(["verified", "pending", "rejected"]).optional(),
  announcement_status: z.enum(["official", "inferred", "manual"]).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminIdentity();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const events = await repository.listAdminEvents();
    return ok({ events });
  } catch {
    return serverError();
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminIdentity();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = await request.json();
    const validated = createSchema.safeParse(payload);

    if (!validated.success) {
      return badRequest(validated.error.issues[0]?.message ?? "invalid payload");
    }

    const created = await repository.createEvent(validated.data);
    return ok({ event: created }, 201);
  } catch {
    return serverError();
  }
}
