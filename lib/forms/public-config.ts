import { deliveryModeSchema } from "./contracts";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const mode = deliveryModeSchema.safeParse(process.env.NEXT_PUBLIC_FORM_MODE);

if (!siteKey) {
  throw new Error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is required");
}
if (!mode.success) {
  throw new Error("NEXT_PUBLIC_FORM_MODE must be no-send, test-recipient, or live");
}

export const publicFormConfig = Object.freeze({
  turnstileSiteKey: siteKey,
  deliveryMode: mode.data,
});
