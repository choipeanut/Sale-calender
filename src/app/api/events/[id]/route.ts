import { repository } from "@/lib/repositories/repository";
import { badRequest, ok, serverError } from "@/lib/http";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return badRequest("event id is required");
    }

    const record = await repository.getEventById(id);
    if (!record) {
      return badRequest("event not found");
    }

    return ok(record);
  } catch {
    return serverError();
  }
}
