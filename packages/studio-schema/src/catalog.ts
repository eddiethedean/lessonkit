export const studioBlockCatalogVersion = 1 as const;

export type StudioBlockCatalogEntry = {
  type: string;
  category: "primitive" | "layout" | "learning" | "stub";
  description: string;
  props: { name: string; type: string; required: boolean; description: string }[];
  rendererStatus: "implemented" | "stub";
};

export function buildStudioBlockCatalog(): {
  schemaVersion: typeof studioBlockCatalogVersion;
  entries: StudioBlockCatalogEntry[];
} {
  return {
    schemaVersion: studioBlockCatalogVersion,
    entries: [
      {
        type: "text",
        category: "primitive",
        description: "Paragraph text content.",
        props: [
          { name: "id", type: "string", required: true, description: "Stable block id." },
          { name: "text", type: "string", required: true, description: "Paragraph body." },
        ],
        rendererStatus: "implemented",
      },
      {
        type: "heading",
        category: "primitive",
        description: "Heading levels 1–3.",
        props: [
          { name: "id", type: "string", required: true, description: "Stable block id." },
          { name: "level", type: "1 | 2 | 3", required: true, description: "Heading level." },
          { name: "text", type: "string", required: true, description: "Heading text." },
        ],
        rendererStatus: "implemented",
      },
      {
        type: "image",
        category: "primitive",
        description: "Image asset reference.",
        props: [
          { name: "id", type: "string", required: true, description: "Stable block id." },
          { name: "src", type: "string", required: true, description: "Image URL or path." },
          { name: "alt", type: "string", required: true, description: "Alt text." },
        ],
        rendererStatus: "implemented",
      },
      {
        type: "button",
        category: "primitive",
        description: "Action button.",
        props: [
          { name: "id", type: "string", required: true, description: "Stable block id." },
          { name: "label", type: "string", required: true, description: "Button label." },
          { name: "href", type: "string", required: false, description: "Optional link target." },
        ],
        rendererStatus: "implemented",
      },
      {
        type: "input",
        category: "primitive",
        description: "Labeled form input.",
        props: [
          { name: "id", type: "string", required: true, description: "Stable block id." },
          { name: "label", type: "string", required: true, description: "Field label." },
          {
            name: "inputType",
            type: "text | email | number",
            required: false,
            description: "HTML input type.",
          },
          {
            name: "placeholder",
            type: "string",
            required: false,
            description: "Placeholder text.",
          },
        ],
        rendererStatus: "implemented",
      },
      {
        type: "container",
        category: "layout",
        description: "Nested block container.",
        props: [
          { name: "id", type: "string", required: true, description: "Stable block id." },
          { name: "blocks", type: "StudioBlock[]", required: true, description: "Child blocks." },
        ],
        rendererStatus: "implemented",
      },
      {
        type: "quiz",
        category: "learning",
        description: "Maps to @lessonkit/react Quiz.",
        props: [
          { name: "id", type: "string", required: true, description: "Stable block id." },
          { name: "checkId", type: "CheckId", required: true, description: "Assessment id." },
          { name: "question", type: "string", required: true, description: "Question text." },
          { name: "choices", type: "string[]", required: true, description: "Answer choices." },
          { name: "answer", type: "string", required: true, description: "Correct choice." },
        ],
        rendererStatus: "implemented",
      },
      {
        type: "scenario",
        category: "learning",
        description: "Maps to @lessonkit/react Scenario.",
        props: [
          { name: "id", type: "string", required: true, description: "Stable block id." },
          { name: "blockId", type: "BlockId", required: false, description: "Telemetry block id." },
          { name: "blocks", type: "StudioBlock[]", required: true, description: "Scenario content." },
        ],
        rendererStatus: "implemented",
      },
      {
        type: "checklist",
        category: "primitive",
        description: "Checklist with read-only preview checkboxes (editor + preview).",
        props: [
          { name: "id", type: "string", required: true, description: "Stable block id." },
          { name: "items", type: "string[]", required: true, description: "Checklist items." },
        ],
        rendererStatus: "implemented",
      },
      {
        type: "video",
        category: "primitive",
        description: "HTML5 video preview block.",
        props: [
          { name: "id", type: "string", required: true, description: "Stable block id." },
          { name: "src", type: "string", required: true, description: "Video URL or path." },
          { name: "title", type: "string", required: false, description: "Accessible title." },
        ],
        rendererStatus: "implemented",
      },
    ],
  };
}
