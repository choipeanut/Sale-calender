import { z } from "zod";

import { requireIdentity } from "@/lib/auth";
import { badRequest, ok, serverError } from "@/lib/http";
import { repository } from "@/lib/repositories/repository";

const payloadSchema = z.object({ token: z.string().min(20) });

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireIdentity();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = await request.json();
    const validated = payloadSchema.safeParse(payload);

    if (!validated.success) {
      return badRequest("Invalid token payload");
    }

    const preference = await repository.appendFcmToken(auth.identity.userId, validated.data.token);
    return ok({ preference }, 201);
  } catch {
    return serverError();
  }
}
