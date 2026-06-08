/**
 * Build sphinx-design tab sets for component pages (Live demo | React | Manifest).
 */

export function iframeHtml(slug, title) {
  return `<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/${slug}"
  title="${title} component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/${slug}" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>`;
}

function formatReactExample(example) {
  const trimmed = example.trim();
  if (trimmed.startsWith("```")) return trimmed;
  return `\`\`\`tsx\n${trimmed}\n\`\`\``;
}

function formatAiPrompt(prompt) {
  return `\`\`\`text\n${prompt.trim()}\n\`\`\``;
}

export function buildTryItSection({ slug, title, reactExample, manifest, aiPrompt }) {
  const sync = `component-${slug}`;
  const tabs = [];

  tabs.push(`:::{tab-item} Live demo
:sync: ${sync}

\`\`\`{raw} html
${iframeHtml(slug, title)}
\`\`\`
:::`);

  if (reactExample) {
    tabs.push(`:::{tab-item} React
:sync: ${sync}

${formatReactExample(reactExample)}
:::`);
  } else {
    tabs.push(`:::{tab-item} React
:sync: ${sync}

Full props and contracts: [block catalog](../block-catalog.md).
:::`);
  }

  if (aiPrompt) {
    tabs.push(`:::{tab-item} AI prompt
:sync: ${sync}

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

${formatAiPrompt(aiPrompt)}
:::`);
  }

  if (manifest?.note || manifest?.snippet) {
    const tabLabel = manifest.snippet ? "Manifest" : "Packaging";
    let body = manifest.note ? `${manifest.note}\n\n` : "";
    if (manifest.snippet) {
      if (!manifest.note) body = "Add under `course.assessments[]`:\n\n";
      body += `\`\`\`json\n${manifest.snippet.trim()}\n\`\`\``;
    }
    tabs.push(`:::{tab-item} ${tabLabel}
:sync: ${sync}

${body.trim()}
:::`);
  }

  return `<!-- try-it:start -->
## Try it

\`\`\`{include} _demo-notice.md
\`\`\`

::::{tab-set}

${tabs.join("\n\n")}

::::
<!-- try-it:end -->

`;
}
