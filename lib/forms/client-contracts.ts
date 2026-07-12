import type { ContactReason, DeliveryMode, SafeFormErrorCode } from "./contracts";

const deliveryModes: readonly DeliveryMode[] = ["no-send", "test-recipient", "live"];
const contactReasons: readonly ContactReason[] = ["speaking", "partnership", "media", "testimony", "general"];
const safeFormErrorCodes: readonly SafeFormErrorCode[] = [
  "invalid_origin",
  "invalid_content_type",
  "body_too_large",
  "invalid_json",
  "invalid_fields",
  "bot_rejected",
  "turnstile_failed",
  "turnstile_expired",
  "already_processing",
  "provider_unavailable",
  "configuration_error",
  "network_error",
];

export function isDeliveryMode(value: unknown): value is DeliveryMode {
  return typeof value === "string" && deliveryModes.includes(value as DeliveryMode);
}

export function isContactReason(value: unknown): value is ContactReason {
  return typeof value === "string" && contactReasons.includes(value as ContactReason);
}

export function isSafeFormErrorCode(value: unknown): value is SafeFormErrorCode {
  return typeof value === "string" && safeFormErrorCodes.includes(value as SafeFormErrorCode);
}
