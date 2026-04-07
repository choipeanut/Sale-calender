import { repository } from "@/lib/repositories/repository";
import { ok, serverError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") ?? undefined;

    const upcoming = await repository.listUpcoming(userId);
    return ok({ events: upcoming });
  } catch {
    return serverError();
  }
}
