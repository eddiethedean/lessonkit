#!/usr/bin/env node
/**
 * Replace Live demo / Example / Packaging sections with a tabbed Try it block.
 * Run: node docs/scripts/sync-component-try-it-tabs.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAiPrompt } from "./lib/component-ai-prompt.mjs";
import { buildTryItSection } from "./lib/component-page-tabs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const MANIFEST = path.join(ROOT, "docs/component-demos/manifest.json");
const COPY = path.join(ROOT, "docs/component-demos/page-copy.json");
const SNIPPETS = path.join(ROOT, "docs/component-demos/manifest-snippets.json");
const COMPONENTS = path.join(ROOT, "docs/reference/components");

const TRY_START = "<!-- try-it:start -->";
const TRY_END = "<!-- try-it:end -->";

function extractReactExample(content) {
  const match = content.match(/## Example\s*\n+\s*(```[\s\S]*?```)/);
  return match?.[1] ?? null;
}

function stripTryItLegacy(content) {
  if (content.includes(TRY_START)) {
    return content.replace(new RegExp(`${TRY_START}[\\s\\S]*?${TRY_END}`, "m"), "{{TRY_IT}}");
  }
  return content.replace(/## Live demo[\s\S]*?(?=\n## See also)/, "{{TRY_IT}}");
}

function stripPackagingLegacy(content) {
  const withMarkers = content.replace(
    new RegExp(`\\n?<!-- packaging:start -->[\\s\\S]*?<!-- packaging:end -->`, "m"),
    "",
  );
  return withMarkers.replace(/\n?## Packaging \(`lessonkit\.json`\)[\s\S]*?(?=\n## See also)/, "");
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const copyBySlug = JSON.parse(await readFile(COPY, "utf8"));
  const snippets = JSON.parse(await readFile(SNIPPETS, "utf8"));
  let updated = 0;

  for (const entry of manifest.components) {
    const filePath = path.join(COMPONENTS, `${entry.slug}.md`);
    let content = await readFile(filePath, "utf8");

    const reactExample =
      copyBySlug[entry.slug]?.example ?? extractReactExample(content) ?? null;
    const copy = copyBySlug[entry.slug] ?? {};
    const tryIt = buildTryItSection({
      slug: entry.slug,
      title: entry.title,
      reactExample,
      manifest: snippets[entry.slug],
      aiPrompt: buildAiPrompt({
        entry,
        reactExample,
        manifest: snippets[entry.slug],
        override: copy.aiPrompt,
      }),
    });

    let next = stripTryItLegacy(content);
    next = stripPackagingLegacy(next);

    if (!next.includes("{{TRY_IT}}")) {
      const seeAlsoIndex = next.indexOf("\n## See also");
      if (seeAlsoIndex === -1) {
        next = `${next.trimEnd()}\n\n${tryIt}\n`;
      } else {
        next = `${next.slice(0, seeAlsoIndex).trimEnd()}\n\n${tryIt}${next.slice(seeAlsoIndex)}\n`;
      }
    } else {
      next = next.replace("{{TRY_IT}}", tryIt);
    }

    await writeFile(filePath, next);
    updated += 1;
  }

  console.log(`Tabbed Try it sections synced on ${updated} component page(s).`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
