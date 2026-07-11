import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

function resolveSchemaPath() {
  // Prefer module-relative resolution. Vitest may present a non-file import.meta.url;
  // fall back to the repo-root config path used by CLI runs from the package root.
  try {
    if (typeof import.meta.url === "string" && import.meta.url.startsWith("file:")) {
      return fileURLToPath(new URL("../../config/retention-evidence.schema.json", import.meta.url));
    }
  } catch {
    // fall through
  }
  return resolve(process.cwd(), "config/retention-evidence.schema.json");
}

const schema = JSON.parse(await readFile(resolveSchemaPath(), "utf8"));
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

export async function validateRetentionEvidence(record, baseDirectory) {
  if (!validate(record)) throw new Error(`retention evidence invalid: ${ajv.errorsText(validate.errors)}`);
  const serialized = JSON.stringify(record);
  if (/@|prayer text|contact text|xkeysib-|turnstile/i.test(serialized)) throw new Error("retention evidence contains forbidden raw data or credentials");
  const root = resolve(baseDirectory);
  for (const evidence of record.evidenceFiles) {
    const path = resolve(root, evidence.path);
    if (path === root || !path.startsWith(`${root}${sep}`)) throw new Error(`evidence path escapes base directory: ${evidence.path}`);
    const bytes = await readFile(path);
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (digest !== evidence.sha256) throw new Error(`evidence hash mismatch: ${evidence.path}`);
  }
  return { status: "pass", evidenceFiles: record.evidenceFiles.length };
}
