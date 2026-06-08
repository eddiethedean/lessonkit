/**
 * Build copy-paste AI prompts that reproduce component page React examples.
 */

export function stripCodeFence(example) {
  const trimmed = example.trim();
  const match = trimmed.match(/^```(?:tsx|jsx)?\n?([\s\S]*?)```$/);
  return match ? match[1].trim() : trimmed;
}

function manifestSyncLines(manifest) {
  if (!manifest) return [];
  const lines = [];
  if (manifest.snippet) {
    lines.push("Sync lessonkit.json — add under course.assessments[]:");
    lines.push("");
    lines.push(manifest.snippet.trim());
  } else if (manifest.note) {
    lines.push("Packaging notes:");
    for (const line of manifest.note.split("\n")) {
      const trimmed = line.trim();
      if (trimmed) lines.push(trimmed);
    }
  }
  return lines;
}

export function buildAiPrompt({ entry, reactExample, manifest, override }) {
  if (override?.trim()) return override.trim();

  const { blockType, title, h5p, category, slug } = entry;
  const tsx = reactExample ? stripCodeFence(reactExample) : null;

  if (!tsx) {
    const target = blockType ?? title;
    return [
      "Read lessonkit.json and src/App.tsx before editing.",
      "",
      `Add a ${target} block from @lessonkit/react (block-catalog.v3.json) inside the active <Lesson>.`,
      "Use props from the block catalog and the React tab on this component page.",
      "",
      "Requirements:",
      "- Import only from @lessonkit/react.",
      "- Keep existing courseId, lessonId, and navigation stable.",
      "- After edits, list changed files and what to verify with lessonkit dev.",
    ].join("\n");
  }

  const lines = ["Read lessonkit.json and src/App.tsx before editing.", ""];

  if (slug === "course-structure") {
    lines.push("Ensure the course shell matches this structure:");
  } else if (slug === "text-and-heading") {
    lines.push("Add Text and Heading blocks like this example:");
  } else if (h5p && blockType) {
    lines.push(
      `Add a ${blockType} block (H5P-style: ${h5p}) like this example inside the active <Lesson>:`,
    );
  } else if (category === "Compound child" && blockType) {
    lines.push(
      `Add ${blockType} inside the correct parent compound block, matching this example:`,
    );
  } else if (blockType) {
    lines.push(`Add a ${blockType} block like this example inside the active <Lesson>:`);
  } else {
    lines.push(`Add this block like the example below:`);
  }

  lines.push("", tsx, "", "Requirements:");
  lines.push("- Import only from @lessonkit/react; use block types from block-catalog.v3.json.");
  lines.push("- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.");

  if (category === "Compound child") {
    lines.push("- Mount only inside the documented parent compound (see component page When to use).");
  }

  if (blockType === "KnowledgeCheck") {
    lines.push("- Prefer importing Quiz in new code; KnowledgeCheck is a deprecated alias with identical behavior.");
  }

  const manifestLines = manifestSyncLines(manifest);
  if (manifestLines.length) {
    lines.push(...manifestLines);
    lines.push("");
  }

  lines.push(
    "- After edits, list changed files and what to verify in the browser (lessonkit dev).",
    "",
    "Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html",
  );

  return lines.join("\n");
}
