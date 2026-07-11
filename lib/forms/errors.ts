import type { FormSubmitResult, SafeFormErrorCode } from "./contracts";

const messages: Record<SafeFormErrorCode, string> = {
  invalid_origin: "This submission could not be verified. Refresh the page and try again.",
  invalid_content_type: "This form sent an unsupported request. Refresh the page and try again.",
  body_too_large: "This submission is too large. Shorten the message and try again.",
  invalid_json: "This submission could not be read. Refresh the page and try again.",
  invalid_fields: "Review the highlighted fields and try again.",
  bot_rejected: "This submission could not be accepted.",
  turnstile_failed: "Complete the security check and try again.",
  turnstile_expired: "The security check expired. Complete the new check and try again.",
  already_processing: "This submission is still processing. Wait a moment and try again.",
  provider_unavailable: "We could not deliver this right now. Your text is still here; please try again.",
  configuration_error: "This form is temporarily unavailable. Please try again later.",
  network_error: "The network request did not finish. Check your connection and try again.",
};

export class FormFault extends Error {
  constructor(
    public readonly code: SafeFormErrorCode,
    public readonly status: number,
    public readonly retryable: boolean,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(messages[code]);
    this.name = "FormFault";
  }
}

export function toErrorResult(fault: FormFault): Extract<FormSubmitResult, { ok: false }> {
  return {
    ok: false,
    status: "error",
    code: fault.code,
    retryable: fault.retryable,
    message: messages[fault.code],
    ...(fault.fieldErrors ? { fieldErrors: fault.fieldErrors } : {}),
  };
}
