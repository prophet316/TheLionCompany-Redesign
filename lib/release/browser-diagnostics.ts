export function isExpectedPreviewCspDiagnostic(message: string): boolean {
  if (
    message === "The Content Security Policy directive 'frame-ancestors' is ignored when delivered in a report-only policy."
  ) {
    return true;
  }
  return message.startsWith("The Content Security Policy '")
    && message.includes("was delivered in report-only mode")
    && message.includes("does not specify a 'report-to'");
}

export function isExpectedWebKitNavigationDiagnostic(name: string): boolean {
  return name === "Fetch API cannot load http";
}

export function isExpectedNextNavigationAbort(
  failure: string,
  resourceType: string,
  url: URL,
): boolean {
  const browserCancelledRequest = failure === "net::ERR_ABORTED" || failure === "NS_BINDING_ABORTED";
  if (!browserCancelledRequest) return false;
  return url.searchParams.has("_rsc")
    || resourceType === "image"
    || (resourceType === "script" && url.pathname.startsWith("/_next/static/chunks/"));
}
