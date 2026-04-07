import { z } from "zod";

import { requireAdminIdentity } from "@/lib/auth";
import { badRequest, ok, serverError } from "@/lib/http";
import { repository } from "@/lib/repositories/repository";

const mergeSchema = z.object({
  primary_id: z.string(),
  duplicate_id: z.string(),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminIdentity();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = await request.json();
    const validated = mergeSchema.safeParse(payload);

    if (!validated.success) {
      return badRequest(validated.error.issues[0]?.message ?? "invalid payload");
    }

    const merged = await repository.mergeEvents(validated.data.primary_id, validated.data.duplicate_id);
    if (!merged) {
      return badRequest("merge target not found");
    }

    return ok({ event: merged });
  } catch {
    return serverError();
  }
}
