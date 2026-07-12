import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function luminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)!.map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe("Gathering design tokens", () => {
  const css = readFileSync("styles/tokens.css", "utf8");

  it("locks the approved parchment, ink, and single clay accent", () => {
    expect(css).toContain("--color-parchment: #f3e9d7");
    expect(css).toContain("--color-ink: #24151f");
    expect(css).toContain("--color-accent: #964532");
  });

  it("keeps ink and accent readable on parchment", () => {
    expect(contrast("#24151f", "#f3e9d7")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#964532", "#f3e9d7")).toBeGreaterThanOrEqual(4.5);
  });
});
