import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { seedProtectedDeploymentCookie } from "../support/release-helpers";

test.beforeEach(async ({ context }) => seedProtectedDeploymentCookie(context));

function runtimeCanaries() {
  if (process.env.PII_CANARIES_B64) {
    const values = JSON.parse(Buffer.from(process.env.PII_CANARIES_B64, "base64url").toString("utf8"));
    if (Array.isArray(values) && values.length === 4 && values.every((value) => typeof value === "string" && value.length >= 12)) {
      return { prayer: values[0], contact: values[1], email: values[2], name: values[3] };
    }
    throw new Error("PII_CANARIES_B64 must encode exactly four strings of 12 or more characters");
  }
  const nonce = randomUUID();
  return {
    prayer: `SYNTHETIC-PRAYER-${nonce}`,
    contact: `SYNTHETIC-CONTACT-${nonce}`,
    email: `tlc-release-${nonce}@example.org`,
    name: `Synthetic Person ${nonce}`,
  };
}
const canary = runtimeCanaries();

test("form canaries never reach URL, browser storage, cookie, console, or third-party body", async ({ page }) => {
  const consoleText: string[] = [];
  const thirdPartyBodies: string[] = [];
  page.on("console", (message) => consoleText.push(message.text()));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== new URL(page.url()).origin) thirdPartyBodies.push(request.postData() ?? "");
  });
  await page.route("**/api/forms/prayer", (route) => route.fulfill({
    status: 202,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, status: "accepted", submissionId: crypto.randomUUID(), deliveryMode: "no-send", replayed: false, message: "Preview test accepted — no message was sent." }),
  }));
  await page.goto("/prayer");
  await page.evaluate(async (value) => {
    await fetch("/api/forms/prayer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        submissionId: crypto.randomUUID(), displayName: value.name, email: value.email,
        request: value.prayer, followUpRequested: true, turnstileToken: "synthetic-test-token", website: "",
      }),
    });
  }, canary);
  const browserState = await page.evaluate(() => JSON.stringify({
    localStorage: { ...localStorage }, sessionStorage: { ...sessionStorage }, url: location.href, cookie: document.cookie,
  }));
  for (const value of Object.values(canary)) {
    expect(browserState).not.toContain(value);
    expect(consoleText.join("\n")).not.toContain(value);
    expect(thirdPartyBodies.join("\n")).not.toContain(value);
  }
});

test("offline, timeout, and provider outage retain typed text and never announce success", async ({ page, context }) => {
  await page.goto("/prayer");
  const form = page.getByRole("form", { name: "Private prayer form" });
  // exact textbox role avoids the prayer form region, whose accessible name also contains "Prayer request"
  const request = form.getByRole("textbox", { name: "Prayer request", exact: true });
  const alert = form.getByRole("alert");
  const submit = () => form.evaluate((element) => (element as HTMLFormElement).requestSubmit());
  await request.fill(canary.prayer);

  await context.setOffline(true);
  await submit();
  await expect(alert).toContainText(/network|connection/i);
  await expect(request).toHaveValue(canary.prayer);
  await context.setOffline(false);

  const timeoutHandler = (route: import("@playwright/test").Route) => route.abort("timedout");
  await page.route("**/api/forms/prayer", timeoutHandler);
  await submit();
  await expect(alert).toContainText(/network|connection/i);
  await expect(request).toHaveValue(canary.prayer);
  await page.unroute("**/api/forms/prayer", timeoutHandler);

  await page.route("**/api/forms/prayer", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({
      ok: false, status: "error", code: "provider_unavailable", retryable: true,
      message: "We could not deliver this right now. Your text is still here; please try again.",
    }) });
  });
  await submit();
  await expect(alert).toContainText(/could not deliver/i);
  await expect(request).toHaveValue(canary.prayer);
  await expect(page.getByText(/was delivered/i)).toHaveCount(0);
});
