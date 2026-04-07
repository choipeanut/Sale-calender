import { z } from "zod";

import { requireAdminIdentity } from "@/lib/auth";
import { badRequest, ok, serverError } from "@/lib/http";
import { repository } from "@/lib/repositories/repository";

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  date_precision: z.enum(["day", "month", "estimated", "tbd"]).optional(),
  status: z.enum(["scheduled", "ongoing", "ended", "draft", "hold", "inactive"]).optional(),
  is_estimated: z.boolean().optional(),
  estimation_basis: z.string().nullable().optional(),
  verification_status: z.enum(["verified", "pending", "rejected"]).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  admin_note: z.string().optional(),
  has_correction: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminIdentity();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = await request.json();
    const validated = patchSchema.safeParse(payload);

    if (!validated.success) {
      return badRequest(validated.error.issues[0]?.message ?? "invalid payload");
    }

    const { id } = await context.params;
    const updated = await repository.patchEvent(id, validated.data);
    if (!updated) {
      return badRequest("event not found");
    }

    return ok({ event: updated });
  } catch {
    return serverError();
  }
}
