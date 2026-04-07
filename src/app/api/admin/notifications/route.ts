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
    const logs = await repository.listNotificationLogs();
    return ok({ logs });
  } catch {
    return serverError();
  }
}
