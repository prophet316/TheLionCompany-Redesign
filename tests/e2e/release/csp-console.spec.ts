import { expect, test } from "@playwright/test";
import { INDEXABLE_SMOKE_ROUTES, seedProtectedDeploymentCookie, denyAnalytics } from "../support/release-helpers";
import {
  isExpectedNextNavigationAbort,
  isExpectedPreviewCspDiagnostic,
  isExpectedWebKitNavigationDiagnostic,
} from "@/lib/release/browser-diagnostics";

test.beforeEach(async ({ context }) => seedProtectedDeploymentCookie(context));

test("required routes emit no CSP violation, uncaught error, or failed first-party request", async ({ page, browserName }) => {
  test.setTimeout(90_000);
  const cspViolations: string[] = [];
  if (browserName === "chromium") {
    const session = await page.context().newCDPSession(page);
    session.on("Audits.issueAdded", ({ issue }: {
      issue: {
        code: string;
        details?: {
          contentSecurityPolicyIssueDetails?: {
            blockedURL?: string;
            violatedDirective?: string;
            contentSecurityPolicyViolationType?: string;
          };
        };
      };
    }) => {
      if (issue.code !== "ContentSecurityPolicyIssue") return;
      const details = issue.details?.contentSecurityPolicyIssueDetails;
      cspViolations.push(`${details?.violatedDirective ?? "unknown"}:${details?.blockedURL ?? "unknown"}:${details?.contentSecurityPolicyViolationType ?? "unknown"}`);
    });
    await session.send("Audits.enable");
  }
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedFirstParty: string[] = [];
  const baseURL = test.info().project.use.baseURL;
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const baseOrigin = new URL(baseURL).origin;
  page.on("console", (message) => {
    if (message.type() === "error" && !isExpectedPreviewCspDiagnostic(message.text())) {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (browserName === "webkit" && isExpectedWebKitNavigationDiagnostic(error.name)) return;
    pageErrors.push(error.name);
  });
  page.on("requestfailed", (request) => {
    const url = new URL(request.url());
    const failure = request.failure()?.errorText ?? "unknown";
    const expectedNextNavigationAbort = isExpectedNextNavigationAbort(failure, request.resourceType(), url);
    if (url.origin === baseOrigin && !expectedNextNavigationAbort) {
      failedFirstParty.push(`${request.url()}:${failure}`);
    }
  });
  for (const path of INDEXABLE_SMOKE_ROUTES) {
    // Deterministic completion: main is the route shell boundary. Pages may keep
    // client activity (consent/analytics hooks), so networkidle is not reliable.
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await expect(page.locator("main")).toBeVisible();
    await denyAnalytics(page);
  }
  expect(cspViolations).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedFirstParty).toEqual([]);
});
