import { expect, test } from "@playwright/test";

test("prayer failure retains private text and accessible retry", async ({ page }) => {
  await page.route("**/api/forms/prayer", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        status: "error",
        code: "provider_unavailable",
        retryable: true,
        message: "We could not deliver this right now. Your text is still here; please try again.",
      }),
    });
  });
  await page.goto("/prayer");
  const form = page.getByRole("form", { name: "Private prayer form" });
  const request = form.getByRole("textbox", { name: "Prayer request", exact: true });
  await request.fill("Please pray for wisdom and peace this week.");
  await expect(page.getByText(/preview test mode/i)).toBeVisible();
  await form.getByRole("button", { name: /send private request/i }).evaluate((button) => {
    (button as HTMLButtonElement).disabled = false;
  });
  await form.getByRole("button", { name: /send private request/i }).click();
  await expect(form.getByRole("alert")).toContainText("could not deliver");
  await expect(request).toHaveValue("Please pray for wisdom and peace this week.");
});

test("connect exposes both permanent form paths", async ({ page }) => {
  await page.goto("/connect");
  await expect(page.getByRole("form", { name: "Contact The Lion Company" })).toBeVisible();
  await expect(page.getByRole("form", { name: "Monthly field notes" })).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("keeps content and direct navigation while explaining protected forms", async ({ page }) => {
    await page.goto("/prayer");
    await expect(page.getByRole("heading", { name: /prayer/i })).toBeVisible();
    await expect(page.getByText(/javascript is required for the security check/i)).toBeVisible();
    await expect(page.locator("a[href='/teachings']").first()).toBeVisible();
  });
});
