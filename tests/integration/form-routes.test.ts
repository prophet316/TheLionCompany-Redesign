import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const routes = ["newsletter", "prayer", "contact"] as const;

describe("form route bindings", () => {
  for (const endpoint of routes) {
    it(`${endpoint} is a dynamic Node POST-only binding`, async () => {
      const source = await readFile(
        resolve(`app/api/forms/${endpoint}/route.ts`),
        "utf8",
      );
      expect(source).toContain('export const runtime = "nodejs"');
      expect(source).toContain('export const dynamic = "force-dynamic"');
      expect(source).toContain("export async function POST");
      expect(source).not.toContain("function GET");
      expect(source).not.toContain("function OPTIONS");
      expect(source).toContain(`handleFormRequest(request, "${endpoint}"`);
    });
  }
});
