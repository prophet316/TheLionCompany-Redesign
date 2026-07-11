import { readFileSync } from "node:fs";
import packageJson from "../../../package.json";
import { describe, expect, it } from "vitest";

const playwright = readFileSync("playwright.config.ts", "utf8");
const workflow = readFileSync(".github/workflows/quality.yml", "utf8");
const visualWorkflow = readFileSync(".github/workflows/visual-baselines.yml", "utf8");

describe("release tooling contract", () => {
  it("pins every verification dependency", () => {
    expect(packageJson.devDependencies).toMatchObject({
      "@axe-core/playwright": "4.12.1",
      "@lhci/cli": "0.15.1",
      "ajv": "8.20.0",
      "cheerio": "1.2.0",
      "html-validate": "11.5.5",
      "tsx": "4.23.0",
      "vercel": "55.0.0",
      "wait-on": "9.0.10",
    });
  });

  it("retains deterministic CSP build and exposes every release command", () => {
    expect(packageJson.scripts.build).toBe("node scripts/build-with-csp.mjs");
    const scripts = packageJson.scripts as Record<string, string | undefined>;
    for (const script of [
      "check:html", "check:public", "check:static-media", "check:pii", "bundle:check",
      "lighthouse:collect", "lighthouse:ci", "test:e2e:release",
      "release:doi", "release:smoke", "release:health", "release:evidence:seal",
      "release:evidence:verify",
    ]) expect(scripts[script], script).toBeTruthy();
  });

  it("keeps stable engine names and supports immutable remote targets", () => {
    for (const name of ["chromium", "firefox", "webkit"]) {
      expect(playwright).toContain(`name: "${name}"`);
    }
    expect(playwright).toContain("PLAYWRIGHT_BASE_URL");
    expect(playwright).toContain("VERCEL_AUTOMATION_BYPASS_SECRET");
    expect(playwright).toContain("snapshotPathTemplate");
    expect(playwright).toContain("{platform}");
  });

  it("runs static and all three browser checks without production secrets", () => {
    expect(workflow).toContain("quality / static");
    expect(workflow).toContain("quality / browser (${{ matrix.browser }})");
    expect(workflow).toContain("browser: [chromium, firefox, webkit]");
    expect(workflow).toContain("FORM_DELIVERY_MODE: no-send");
    expect(workflow).toContain("gitleaks_8.30.1_linux_x64.tar.gz");
    expect(workflow).toContain('git --log-opts="--all"');
    expect(workflow).toContain("--redact=100");
    expect(workflow).not.toContain("BREVO_API_KEY");
    expect(workflow).not.toContain("VERCEL_ACCESS_TOKEN");
  });

  it("generates canonical baselines only in the pinned CI-equivalent Linux job", () => {
    expect(visualWorkflow).toContain("workflow_dispatch");
    expect(visualWorkflow).toContain("runs-on: ubuntu-24.04");
    expect(visualWorkflow).toContain("node-version: 22.22.3");
    expect(visualWorkflow).toContain("mcr.microsoft.com/playwright:v1.61.1-noble");
    expect(visualWorkflow).toContain("playwright install --with-deps chromium");
    expect(visualWorkflow).toContain("--update-snapshots");
    expect(visualWorkflow).not.toContain("git push");
  });
});
