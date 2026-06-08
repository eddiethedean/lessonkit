#!/usr/bin/env node
/**
 * Refresh hidden toctree in docs/reference/components/index.md from manifest.json.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const MANIFEST = path.join(ROOT, "docs/component-demos/manifest.json");
const INDEX = path.join(ROOT, "docs/reference/components/index.md");
const START = "<!-- component-toctree:start -->";
const END = "<!-- component-toctree:end -->";

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const slugs = manifest.components.map((c) => c.slug).sort();
  const toctree = [
    "```{toctree}",
    ":maxdepth: 1",
    ":hidden:",
    "",
    ...slugs,
    "```",
  ].join("\n");

  const index = await readFile(INDEX, "utf8");
  const pattern = new RegExp(`${START}[\\s\\S]*?${END}`, "m");
  if (!pattern.test(index)) {
    throw new Error(`Missing toctree markers in ${INDEX}`);
  }
  const next = index.replace(pattern, `${START}\n${toctree}\n${END}`);
  await writeFile(INDEX, next);
  console.log(`Updated component toctree (${slugs.length} entries).`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
