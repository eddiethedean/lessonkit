#!/usr/bin/env node
/**
 * Merge demo-examples.json into page-copy.json example fields.
 * Run: node docs/scripts/sync-demo-examples-to-page-copy.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const EXAMPLES = path.join(ROOT, "docs/component-demos/demo-examples.json");
const COPY = path.join(ROOT, "docs/component-demos/page-copy.json");

const examples = JSON.parse(await readFile(EXAMPLES, "utf8"));
const copy = JSON.parse(await readFile(COPY, "utf8"));

let updated = 0;
for (const [slug, example] of Object.entries(examples)) {
  if (!copy[slug]) {
    console.warn(`skip: no page-copy entry for ${slug}`);
    continue;
  }
  copy[slug].example = example;
  updated += 1;
}

await writeFile(COPY, `${JSON.stringify(copy, null, 2)}\n`, "utf8");
console.log(`Updated ${updated} examples in page-copy.json`);
