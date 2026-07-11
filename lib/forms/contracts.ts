import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalName = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).max(80).optional(),
);
const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().trim().toLowerCase().email().max(254).optional(),
);
const email = z.string().trim().toLowerCase().email().max(254);
const shared = {
  submissionId: z.string().uuid(),
  turnstileToken: z.string().min(1).max(2_048),
  website: z.string().max(200),
};

export const formEndpointSchema = z.enum(["newsletter", "prayer", "contact"]);
export const newsletterPlacementSchema = z.enum(["inline", "prompt", "connect"]);
export const prayerPlacementSchema = z.enum(["home", "prayer"]);
export const contactReasonSchema = z.enum([
  "speaking",
  "partnership",
  "media",
  "testimony",
  "general",
]);
export const turnstileActionSchema = z.enum([
  "newsletter_submit",
  "prayer_submit",
  "contact_submit",
]);
export const deliveryModeSchema = z.enum(["no-send", "test-recipient", "live"]);

export const newsletterSchema = z
  .object({
    ...shared,
    email,
    firstName: optionalName,
    consent: z.literal(true),
    placement: newsletterPlacementSchema,
  })
  .strict();

export const prayerSchema = z
  .object({
    ...shared,
    displayName: optionalName,
    email: optionalEmail,
    request: z.string().trim().min(20).max(4_000),
    followUpRequested: z.boolean(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.followUpRequested && !value.email) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "Enter an email address if you would like follow-up.",
      });
    }
  });

export const contactSchema = z
  .object({
    ...shared,
    name: z.string().trim().min(1).max(80),
    email,
    reason: contactReasonSchema,
    message: z.string().trim().min(20).max(4_000),
  })
  .strict();

export const safeFormErrorCodeSchema = z.enum([
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
]);

export type FormEndpoint = z.infer<typeof formEndpointSchema>;
export type NewsletterPlacement = z.infer<typeof newsletterPlacementSchema>;
export type PrayerPlacement = z.infer<typeof prayerPlacementSchema>;
export type ContactReason = z.infer<typeof contactReasonSchema>;
export type TurnstileAction = z.infer<typeof turnstileActionSchema>;
export type DeliveryMode = z.infer<typeof deliveryModeSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type PrayerInput = z.infer<typeof prayerSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type SafeFormErrorCode = z.infer<typeof safeFormErrorCodeSchema>;

export type FormSubmitResult =
  | {
      ok: true;
      status: "accepted";
      submissionId: string;
      deliveryMode: DeliveryMode;
      replayed: boolean;
      message: string;
    }
  | {
      ok: false;
      status: "error";
      code: SafeFormErrorCode;
      retryable: boolean;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };
