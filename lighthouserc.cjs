/* eslint-disable @typescript-eslint/no-require-imports -- LHCI loads CommonJS and needs tsx/cjs for the route registry */
require("tsx/cjs");
const { indexableStaticRoutes } = require("./config/routes.ts");

const remote = Boolean(process.env.LIGHTHOUSE_BASE_URL);
const baseURL = process.env.LIGHTHOUSE_BASE_URL ?? "http://127.0.0.1:3000";
if (remote && new URL(baseURL).protocol !== "https:") throw new Error("remote Lighthouse target must use HTTPS");
const protectionSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const collect = {
  url: indexableStaticRoutes.map((path) => new URL(path, baseURL).toString()),
  numberOfRuns: 3,
  ...(protectionSecret ? { puppeteerScript: "./scripts/lighthouse-auth.cjs" } : {}),
  settings: {
    formFactor: "mobile",
    throttlingMethod: "simulate",
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.56,
      uploadThroughputKbps: 675,
      cpuSlowdownMultiplier: 4,
    },
    screenEmulation: { mobile: true, width: 360, height: 800, deviceScaleFactor: 2, disabled: false },
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    chromeFlags: "--headless=new --no-sandbox --disable-dev-shm-usage --disable-background-networking",
  },
};
if (!remote) Object.assign(collect, {
  startServerCommand: "npm run start",
  startServerReadyPattern: "Ready",
  startServerReadyTimeout: 180000,
});

module.exports = {
  ci: {
    collect,
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
