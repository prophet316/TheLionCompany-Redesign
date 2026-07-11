import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3000";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
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
