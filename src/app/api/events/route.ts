import { repository } from "@/lib/repositories/repository";
import { ok, parseBoolean, serverError } from "@/lib/http";
import type { EventFilters } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: EventFilters = {
      brand: searchParams.get("brand") ?? undefined,
      category: (searchParams.get("category") as EventFilters["category"]) ?? undefined,
      month: searchParams.get("month") ?? undefined,
      status: (searchParams.get("status") as EventFilters["status"]) ?? undefined,
      favorite_only: parseBoolean(searchParams.get("favorite_only")),
      q: searchParams.get("q") ?? undefined,
      user_id: searchParams.get("user_id") ?? undefined,
    };

    const events = await repository.listEvents(filters);
    return ok({ events });
  } catch {
    return serverError();
  }
}
