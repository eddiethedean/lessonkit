#!/usr/bin/env node
/**
 * Generate docs/component-demos/ai-prompts.json from manifest + page copy.
 * Run: node docs/scripts/generate-component-ai-prompts.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAiPrompt } from "./lib/component-ai-prompt.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const MANIFEST = path.join(ROOT, "docs/component-demos/manifest.json");
const COPY = path.join(ROOT, "docs/component-demos/page-copy.json");
const SNIPPETS = path.join(ROOT, "docs/component-demos/manifest-snippets.json");
const OUT = path.join(ROOT, "docs/component-demos/ai-prompts.json");

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const copyBySlug = JSON.parse(await readFile(COPY, "utf8"));
  const snippets = JSON.parse(await readFile(SNIPPETS, "utf8"));
  const prompts = {};

  for (const entry of manifest.components) {
    const copy = copyBySlug[entry.slug] ?? {};
    prompts[entry.slug] = buildAiPrompt({
      entry,
      reactExample: copy.example ?? null,
      manifest: snippets[entry.slug],
      override: copy.aiPrompt,
    });
  }

  await writeFile(OUT, `${JSON.stringify(prompts, null, 2)}\n`);
  console.log(`Wrote ${OUT} (${Object.keys(prompts).length} prompts).`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
