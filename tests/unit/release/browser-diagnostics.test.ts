import { describe, expect, it } from "vitest";
import {
  isExpectedPreviewCspDiagnostic,
  isExpectedWebKitNavigationDiagnostic,
} from "../../../lib/release/browser-diagnostics";

describe("browser diagnostics", () => {
  it("recognizes WebKit report-only CSP diagnostics", () => {
    expect(isExpectedPreviewCspDiagnostic(
      "The Content Security Policy directive 'frame-ancestors' is ignored when delivered in a report-only policy.",
    )).toBe(true);
    expect(isExpectedPreviewCspDiagnostic(
      "The Content Security Policy 'default-src self' was delivered in report-only mode, but does not specify a 'report-to'; the policy will have no effect.",
    )).toBe(true);
  });

  it("does not hide real browser errors or CSP violations", () => {
    expect(isExpectedPreviewCspDiagnostic("Refused to execute inline script because it violates CSP")).toBe(false);
    expect(isExpectedPreviewCspDiagnostic("TypeError: undefined is not an object")).toBe(false);
  });

  it("recognizes only WebKit's cross-navigation fetch cancellation", () => {
    expect(isExpectedWebKitNavigationDiagnostic("Fetch API cannot load http")).toBe(true);
    expect(isExpectedWebKitNavigationDiagnostic("TypeError: Fetch failed for /api/forms/prayer")).toBe(false);
  });
});
