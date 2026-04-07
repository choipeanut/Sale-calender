import { z } from "zod";

import { requireIdentity } from "@/lib/auth";
import { badRequest, ok, serverError } from "@/lib/http";
import { repository } from "@/lib/repositories/repository";

const payloadSchema = z.object({
  brand_ids: z.array(z.string()).min(0),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireIdentity();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const favorites = await repository.listFavorites(auth.identity.userId);
    return ok({ favorites });
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

    const favorites = await repository.saveFavorites(auth.identity.userId, validated.data.brand_ids);
    return ok({ favorites });
  } catch {
    return serverError();
  }
}
