import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { validateRetentionEvidence } from "./lib/retention-evidence.mjs";

const path = process.env.RETENTION_EVIDENCE_PATH;
if (!path) throw new Error("RETENTION_EVIDENCE_PATH is required");
const absolute = resolve(path);
const record = JSON.parse(await readFile(absolute, "utf8"));
const result = await validateRetentionEvidence(record, dirname(absolute));
console.log(JSON.stringify(result));
