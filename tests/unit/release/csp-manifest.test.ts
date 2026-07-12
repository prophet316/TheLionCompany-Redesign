import { describe, expect, it } from "vitest";
import { coversCspManifest, mergeCspManifests } from "../../../scripts/lib/csp-manifest.mjs";

type Manifest = {
  version: 1;
  routes: Record<string, string[]>;
  fallback: string[];
};

const manifest = (routes: Manifest["routes"], fallback: string[] = []): Manifest => ({
  version: 1,
  routes,
  fallback,
});

describe("CSP manifest stabilization", () => {
  it("accepts an emitted hash set already covered by the compiled policy", () => {
    const compiled = manifest({ "/": ["'sha256-a'", "'sha256-b'"] }, ["'sha256-fallback'"]);
    const emitted = manifest({ "/": ["'sha256-b'"] }, ["'sha256-fallback'"]);

    expect(coversCspManifest(compiled, emitted)).toBe(true);
  });

  it("rejects a newly emitted hash or route", () => {
    const compiled = manifest({ "/": ["'sha256-a'"] }, ["'sha256-fallback'"]);

    expect(coversCspManifest(compiled, manifest({ "/": ["'sha256-b'"] }))).toBe(false);
    expect(coversCspManifest(compiled, manifest({ "/new": ["'sha256-a'"] }))).toBe(false);
  });

  it("merges alternating builds monotonically and deterministically", () => {
    const left = manifest({ "/": ["'sha256-b'"] }, ["'sha256-y'"]);
    const right = manifest({ "/": ["'sha256-a'"], "/prayer": ["'sha256-c'"] }, ["'sha256-x'"]);

    expect(mergeCspManifests(left, right)).toEqual(manifest({
      "/": ["'sha256-a'", "'sha256-b'"],
      "/prayer": ["'sha256-c'"],
    }, ["'sha256-x'", "'sha256-y'"]));
  });
});
