import { isDeliveryMode } from "./client-contracts";

const preview = process.env.VERCEL_ENV === "preview";
const siteKey =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
  (preview ? "1x00000000000000000000AA" : undefined);
const mode = process.env.NEXT_PUBLIC_FORM_MODE || (preview ? "no-send" : undefined);

if (!siteKey) {
  throw new Error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is required");
}
if (!isDeliveryMode(mode)) {
  throw new Error("NEXT_PUBLIC_FORM_MODE must be no-send, test-recipient, or live");
}

export const publicFormConfig = Object.freeze({
  turnstileSiteKey: siteKey,
  deliveryMode: mode,
});
