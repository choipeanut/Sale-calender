import { requireAdminIdentity } from "@/lib/auth";
import { ok, serverError } from "@/lib/http";
import { runIngestionPipeline } from "@/lib/ingestion/run-ingestion";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdminIdentity();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const output = await runIngestionPipeline("all:cron");
    return ok(output, 201);
  } catch {
    return serverError();
  }
}
