import { z } from "zod";

import { requireAdminIdentity } from "@/lib/auth";
import { badRequest, ok, serverError } from "@/lib/http";
import { runIngestionPipeline } from "@/lib/ingestion/run-ingestion";

const payloadSchema = z.object({
  source_target: z.string().optional(),
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
      return badRequest("invalid payload");
    }

    const output = await runIngestionPipeline(validated.data.source_target ?? "all:manual");
    return ok(output, 201);
  } catch {
    return serverError();
  }
}
