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
