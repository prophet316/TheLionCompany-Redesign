import packageJson from "../../package.json";
import nextConfig from "../../next.config";
import { describe, expect, it } from "vitest";

describe("project contract", () => {
  it("pins the approved runtime and webpack build", () => {
    expect(packageJson.engines.node).toBe(">=22 <23");
    expect(packageJson.dependencies.next).toBe("16.2.10");
    expect(packageJson.dependencies.react).toBe("19.2.7");
    expect(packageJson.devDependencies.typescript).toBe("5.9.3");
    expect(packageJson.scripts.build).toBe("node scripts/build-with-csp.mjs");
  });

  it("enables sha256 SRI without static export mode", () => {
    expect(nextConfig.experimental?.sri?.algorithm).toBe("sha256");
    expect(nextConfig.outputFileTracingRoot).toBe(process.cwd());
    expect(nextConfig).not.toHaveProperty("output");
  });
});
