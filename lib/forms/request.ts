import "server-only";
import { FormFault } from "./errors";

const MAX_BODY_BYTES = 16_384;

export async function readFormJson(
  request: Request,
  allowedOrigins: readonly string[],
): Promise<Record<string, unknown>> {
  if (request.method !== "POST") {
    throw new FormFault("invalid_content_type", 405, false);
  }
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins.includes(origin)) {
    throw new FormFault("invalid_origin", 403, false);
  }
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    throw new FormFault("invalid_content_type", 415, false);
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new FormFault("body_too_large", 413, false);
  }
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new FormFault("body_too_large", 413, false);
      }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new FormFault("invalid_json", 400, false);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new FormFault("invalid_json", 400, false);
  }
  const record = value as Record<string, unknown>;
  if (typeof record.website === "string" && record.website.trim() !== "") {
    throw new FormFault("bot_rejected", 400, false);
  }
  return record;
}
