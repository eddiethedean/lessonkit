#!/usr/bin/env node
/**
 * Regenerate the component picker table in docs/reference/components/index.md
 * from docs/component-demos/manifest.json.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const MANIFEST = path.join(ROOT, "docs/component-demos/manifest.json");
const INDEX = path.join(ROOT, "docs/reference/components/index.md");
const START = "<!-- component-picker:start -->";
const END = "<!-- component-picker:end -->";

function row({ slug, title, category, h5p }) {
  const h5pCell = h5p ?? "—";
  return `| [\`${title}\`](${slug}.md) | ${category} | ${h5pCell} |`;
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const sorted = [...manifest.components].sort((a, b) => a.title.localeCompare(b.title));
  const table = [
    "| Component | Category | H5P-style name |",
    "| --- | --- | --- |",
    ...sorted.map(row),
  ].join("\n");

  const index = await readFile(INDEX, "utf8");
  const pattern = new RegExp(`${START}[\\s\\S]*?${END}`, "m");
  if (!pattern.test(index)) {
    throw new Error(`Missing component picker markers in ${INDEX}`);
  }
  const next = index.replace(pattern, `${START}\n${table}\n${END}`);
  await writeFile(INDEX, next);
  console.log(`Updated component picker (${sorted.length} entries) in ${INDEX}`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
