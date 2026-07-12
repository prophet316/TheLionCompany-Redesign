import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const ledgerPath = "docs/asset-ledger.csv";
if (!existsSync(ledgerPath)) throw new Error("asset ledger missing");

const [header, ...rows] = readFileSync(ledgerPath, "utf8").trim().split("\n");
const required = [
  "final_filename", "source", "owner", "rights_evidence", "allowed_use",
  "width", "height", "transformations", "alt_text_decision", "reviewer", "review_date",
];
if (header.split(",").join("|") !== required.join("|")) throw new Error("asset ledger columns invalid");
if (rows.length === 0) throw new Error("asset ledger has no assets");

const listed = [];
for (const [index, row] of rows.entries()) {
  const values = row.split(",");
  if (values.length !== required.length || values.some((value) => value.trim() === "")) {
    throw new Error(`asset ledger row ${index + 2} is incomplete`);
  }
  if (!existsSync(values[0])) throw new Error(`asset file missing: ${values[0]}`);
  listed.push(values[0]);
}

if (new Set(listed).size !== listed.length) throw new Error("asset ledger contains duplicate filenames");

const mediaExtensions = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".otf"]);
function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const shipped = [
  ...walk("public").filter((path) => mediaExtensions.has(extname(path).toLowerCase())),
  ...walk("lib/art").filter((path) => [".ts", ".tsx"].includes(extname(path).toLowerCase())),
].sort();
const recorded = [...listed].sort();
if (JSON.stringify(shipped) !== JSON.stringify(recorded)) {
  const missing = shipped.filter((path) => !recorded.includes(path));
  const stale = recorded.filter((path) => !shipped.includes(path));
  throw new Error(`asset ledger parity failed; missing=${missing.join("|") || "none"}; stale=${stale.join("|") || "none"}`);
}

console.log(`asset ledger valid: ${rows.length} assets with exhaustive shipped-file parity`);
