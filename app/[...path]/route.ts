import { legacyRouteLedger } from "@/config/redirects";
import { getLegacyOutcome, renderGoneHtml } from "@/lib/redirects";
import { notFound } from "next/navigation";

type Context = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, context: Context) {
  const { path } = await context.params;
  const pathname = `/${path.join("/")}`;
  const outcome = getLegacyOutcome(pathname, legacyRouteLedger);
  if (!outcome || outcome.kind !== "gone") notFound();
  return new Response(renderGoneHtml(pathname), {
    status: 410,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}

export async function HEAD(request: Request, context: Context) {
  const response = await GET(request, context);
  return new Response(null, { status: response.status, headers: response.headers });
}
