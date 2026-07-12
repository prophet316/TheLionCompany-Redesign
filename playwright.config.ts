import { defineConfig, devices } from "@playwright/test";

const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = remoteBaseURL ?? "http://localhost:3000";
const protectionSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/playwright",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.005 } },
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report" }], ["json", { outputFile: "test-results/playwright/results.json" }]]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}-{platform}{ext}",
  use: {
    baseURL,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "America/Chicago",
    trace: protectionSecret ? "off" : "retain-on-failure",
    screenshot: protectionSecret ? "off" : "only-on-failure",
    video: protectionSecret ? "off" : "retain-on-failure",
    serviceWorkers: "block",
  },
  webServer: remoteBaseURL
    ? undefined
    : {
        command: process.env.PLAYWRIGHT_SERVER_COMMAND ?? "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI && !process.env.PLAYWRIGHT_SERVER_COMMAND,
        timeout: 180_000,
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
