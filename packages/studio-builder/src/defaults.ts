import { deriveId } from "@lessonkit/core";
import type { StudioBlock } from "@lessonkit/studio-schema";
import { buildStudioBlockCatalog } from "@lessonkit/studio-schema";

const catalogTypes = new Set(buildStudioBlockCatalog().entries.map((e) => e.type));

export function createDefaultBlock(
  type: string,
  usedIds: ReadonlySet<string> = new Set(),
): StudioBlock {
  if (!catalogTypes.has(type)) {
    throw new Error(`Unknown studio block type: ${type}`);
  }

  const id = deriveId(type, usedIds);

  switch (type) {
    case "text":
      return { type: "text", id, text: "New text" };
    case "heading":
      return { type: "heading", id, level: 2, text: "New heading" };
    case "image":
      return { type: "image", id, src: "", alt: "" };
    case "button":
      return { type: "button", id, label: "Button" };
    case "input":
      return { type: "input", id, label: "Label", inputType: "text", placeholder: "" };
    case "container":
      return { type: "container", id, blocks: [] };
    case "quiz":
      return {
        type: "quiz",
        id,
        checkId: deriveId("check", usedIds),
        question: "Question?",
        choices: ["Option A", "Option B"],
        answer: "Option A",
      };
    case "scenario":
      return { type: "scenario", id, blocks: [] };
    case "checklist":
      return { type: "checklist", id, items: ["Item 1"] };
    case "video":
      return { type: "video", id, src: "", title: "Video" };
    /* v8 ignore start -- catalogTypes guard makes default unreachable */
    default:
      throw new Error(`Unhandled block type: ${type}`);
    /* v8 ignore stop */
  }
}
