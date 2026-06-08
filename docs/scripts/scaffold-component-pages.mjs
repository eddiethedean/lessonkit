#!/usr/bin/env node
/**
 * Scaffold docs/reference/components/<slug>.md from manifest + page copy.
 * Skips files that already exist unless --force is passed.
 */
import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAiPrompt } from "./lib/component-ai-prompt.mjs";
import { buildTryItSection } from "./lib/component-page-tabs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const MANIFEST = path.join(ROOT, "docs/component-demos/manifest.json");
const COPY = path.join(ROOT, "docs/component-demos/page-copy.json");
const SNIPPETS = path.join(ROOT, "docs/component-demos/manifest-snippets.json");
const OUT_DIR = path.join(ROOT, "docs/reference/components");
const force = process.argv.includes("--force");

function h5pBlock(h5p) {
  if (!h5p) return "";
  return `:::{admonition} H5P equivalent
:class: tip

**H5P ${h5p}**
:::

`;
}

function page(entry, copy, manifestSnippet) {
  const { slug, title, h5p } = entry;
  const whenToUse = copy.whenToUse ?? `Use \`${title}\` when it fits your lesson goal. See the live demo and [block catalog](../block-catalog.md) for props and nesting rules.`;
  const requirements = copy.requirements ?? "";
  const seeAlso = copy.seeAlso ?? `- [Block catalog](../block-catalog.md)`;
  const reactExample = copy.example ?? null;
  const tryIt = buildTryItSection({
    slug,
    title,
    reactExample,
    manifest: manifestSnippet,
    aiPrompt: buildAiPrompt({
      entry,
      reactExample,
      manifest: manifestSnippet,
      override: copy.aiPrompt,
    }),
  });

  return `# ${title}

${h5pBlock(h5p)}## When to use

${whenToUse}

${requirements ? `## Requirements\n\n${requirements}\n\n` : ""}${tryIt}

## See also

${seeAlso}
`;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const copyBySlug = JSON.parse(await readFile(COPY, "utf8"));
  const snippets = JSON.parse(await readFile(SNIPPETS, "utf8"));
  let written = 0;
  let skipped = 0;

  for (const entry of manifest.components) {
    const outPath = path.join(OUT_DIR, `${entry.slug}.md`);
    if (!force && (await exists(outPath))) {
      skipped += 1;
      continue;
    }
    const copy = copyBySlug[entry.slug] ?? {};
    await writeFile(outPath, page(entry, copy, snippets[entry.slug] ?? null));
    written += 1;
  }

  console.log(`Scaffolded ${written} component page(s), skipped ${skipped} existing.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
