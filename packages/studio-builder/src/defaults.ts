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
    case "trueFalse":
      return {
        type: "trueFalse",
        id,
        checkId: deriveId("check", usedIds),
        question: "True or false?",
        answer: true,
      };
    case "fillInTheBlanks":
      return {
        type: "fillInTheBlanks",
        id,
        checkId: deriveId("check", usedIds),
        template: "The *answer* goes here.",
      };
    case "markTheWords":
      return {
        type: "markTheWords",
        id,
        checkId: deriveId("check", usedIds),
        text: "Select the correct words in this sentence.",
        correctWords: ["correct"],
      };
    case "dragTheWords":
      return {
        type: "dragTheWords",
        id,
        checkId: deriveId("check", usedIds),
        template: "Drag *words* into place.",
        words: ["words"],
      };
    case "dragAndDrop":
      return {
        type: "dragAndDrop",
        id,
        checkId: deriveId("check", usedIds),
        items: [{ id: "item-1", label: "Item 1" }],
        targets: [{ id: "target-1", label: "Drop zone", accepts: "item-1" }],
      };
    case "page":
      return {
        type: "page",
        id,
        blockId: deriveId("page", usedIds),
        title: "Page",
        blocks: [{ type: "text", id: deriveId("text", usedIds), text: "Page content" }],
      };
    case "interactiveBook":
      return {
        type: "interactiveBook",
        id,
        blockId: deriveId("book", usedIds),
        title: "Interactive Book",
        pages: [
          {
            type: "page",
            id: deriveId("page", usedIds),
            blockId: deriveId("page", usedIds),
            title: "Chapter 1",
            blocks: [],
          },
        ],
      };
    case "assessmentSequence":
      return {
        type: "assessmentSequence",
        id,
        blockId: deriveId("sequence", usedIds),
        sequential: true,
        blocks: [],
      };
    case "accordion":
      return {
        type: "accordion",
        id,
        blockId: deriveId("accordion", usedIds),
        sections: [
          {
            id: "section-1",
            title: "Section 1",
            blocks: [{ type: "text", id: deriveId("text", usedIds), text: "Section content" }],
          },
        ],
      };
    case "dialogCards":
      return {
        type: "dialogCards",
        id,
        blockId: deriveId("dialog", usedIds),
        cards: [{ front: "Front", back: "Back" }],
      };
    case "flashcards":
      return {
        type: "flashcards",
        id,
        blockId: deriveId("flashcards", usedIds),
        cards: [{ front: "Term", back: "Definition" }],
      };
    case "imageHotspots":
      return {
        type: "imageHotspots",
        id,
        blockId: deriveId("hotspots", usedIds),
        src: "",
        alt: "",
        hotspots: [
          {
            id: "hotspot-1",
            label: "Hotspot 1",
            x: 50,
            y: 50,
            blocks: [{ type: "text", id: deriveId("text", usedIds), text: "Hotspot content" }],
          },
        ],
      };
    case "imageSlider":
      return {
        type: "imageSlider",
        id,
        blockId: deriveId("slider", usedIds),
        slides: [{ src: "", alt: "Slide 1" }],
      };
    case "findHotspot":
      return {
        type: "findHotspot",
        id,
        checkId: deriveId("check", usedIds),
        src: "",
        alt: "",
        targets: [{ id: "target-1", label: "Hotspot", x: 50, y: 50 }],
        correctTargetId: "target-1",
      };
    case "findMultipleHotspots":
      return {
        type: "findMultipleHotspots",
        id,
        checkId: deriveId("check", usedIds),
        src: "",
        alt: "",
        targets: [
          { id: "target-1", label: "Hotspot 1", x: 30, y: 30 },
          { id: "target-2", label: "Hotspot 2", x: 70, y: 70 },
        ],
        correctTargetIds: ["target-1"],
      };
    /* v8 ignore start -- catalogTypes guard makes default unreachable */
    default:
      throw new Error(`Unhandled block type: ${type}`);
    /* v8 ignore stop */
  }
}
