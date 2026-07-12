import { brotliCompressSync } from "node:zlib";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const manifest = JSON.parse(await readFile(".next/build-manifest.json", "utf8"));

async function readAppRootFiles() {
  try {
    const appManifest = JSON.parse(await readFile(".next/app-build-manifest.json", "utf8"));
    return Object.entries(appManifest.pages ?? {})
      .filter(([key]) => key === "/layout" || key === "/page")
      .flatMap(([, files]) => files);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    // Next.js 16 no longer emits app-build-manifest.json. Recover the initial
    // home document assets so the gate remains conservative without undercounting.
    const homeHtml = await readFile(".next/server/app/index.html", "utf8");
    return [...homeHtml.matchAll(/\/_next\/(static\/(?:chunks|css)\/[^"'\\\s]+)/g)].map((match) => match[1]);
  }
}

const appRootFiles = await readAppRootFiles();
const routeFiles = new Set([...(manifest.rootMainFiles ?? []), ...(manifest.pages?.["/_app"] ?? []), ...(manifest.pages?.["/"] ?? []), ...appRootFiles]);
const jsFiles = [...routeFiles].filter((file) => file.endsWith(".js"));
const cssFiles = [...routeFiles].filter((file) => file.endsWith(".css"));

async function compressed(files) {
  let bytes = 0;
  for (const file of files) bytes += brotliCompressSync(await readFile(resolve(".next", file))).byteLength;
  return bytes;
}
const javascriptBytes = await compressed(jsFiles);
const cssBytes = await compressed(cssFiles);
if (javascriptBytes > 180 * 1024) throw new Error(`initial Brotli JS ${javascriptBytes} exceeds ${180 * 1024}`);
if (cssBytes > 60 * 1024) throw new Error(`initial Brotli CSS ${cssBytes} exceeds ${60 * 1024}`);
const result = { status: "pass", javascriptBytes, cssBytes, jsFiles: jsFiles.length, cssFiles: cssFiles.length };
if (process.env.RELEASE_EVIDENCE_DIR) {
  await mkdir(process.env.RELEASE_EVIDENCE_DIR, { recursive: true, mode: 0o700 });
  await writeFile(resolve(process.env.RELEASE_EVIDENCE_DIR, "bundle-summary.json"), `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
}
console.log(JSON.stringify(result));
