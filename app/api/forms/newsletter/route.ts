import { handleFormRequest } from "../../../../lib/forms/handler";
import { getFormServices } from "../../../../lib/forms/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleFormRequest(request, "newsletter", getFormServices());
}
