import { repository } from "@/lib/repositories/repository";
import { ok, serverError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = await repository.listBrands();
    return ok({ brands });
  } catch {
    return serverError();
  }
}
