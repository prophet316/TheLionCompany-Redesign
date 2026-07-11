import { expect, test } from "@playwright/test";
import { INDEXABLE_SMOKE_ROUTES, seedProtectedDeploymentCookie } from "../support/release-helpers";

test.beforeEach(async ({ context }) => seedProtectedDeploymentCookie(context));

test("required routes emit no CSP violation, uncaught error, or failed first-party request", async ({ page }) => {
  const cspViolations: string[] = [];
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
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedFirstParty: string[] = [];
  const baseURL = test.info().project.use.baseURL;
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const baseOrigin = new URL(baseURL).origin;
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.name));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "unknown";
    if (new URL(request.url()).origin === baseOrigin && failure !== "net::ERR_ABORTED") {
      failedFirstParty.push(`${request.url()}:${failure}`);
    }
  });
  for (const path of INDEXABLE_SMOKE_ROUTES) {
    // Deterministic completion: main is the route shell boundary. Pages may keep
    // client activity (consent/analytics hooks), so networkidle is not reliable.
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await page.waitForTimeout(100);
  }
  expect(cspViolations).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedFirstParty).toEqual([]);
});
