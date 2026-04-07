import { requireAdminIdentity } from "@/lib/auth";
import { ok, serverError } from "@/lib/http";
import { repository } from "@/lib/repositories/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminIdentity();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const jobs = await repository.listCrawlJobs();
    return ok({ jobs });
  } catch {
    return serverError();
  }
}
