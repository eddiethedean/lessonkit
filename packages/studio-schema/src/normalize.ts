import { deriveId } from "@lessonkit/core";
import type { StudioBlock, StudioPage, StudioProjectV1 } from "./types";
import { studioSchemaVersion } from "./types";

function normalizeBlocks(blocks: StudioBlock[], usedIds: Set<string>): StudioBlock[] {
  return blocks.map((block) => {
    const id = block.id.trim() || deriveId(block.type, usedIds);
    usedIds.add(id);

    switch (block.type) {
      case "text":
        return { ...block, id, text: block.text.trim() };
      case "heading":
        return { ...block, id, text: block.text.trim() };
      case "image":
        return { ...block, id, src: block.src.trim(), alt: block.alt.trim() };
      case "button":
        return {
          ...block,
          id,
          label: block.label.trim(),
          ...(block.href ? { href: block.href.trim() } : {}),
        };
      case "input":
        return {
          ...block,
          id,
          label: block.label.trim(),
          ...(block.placeholder ? { placeholder: block.placeholder.trim() } : {}),
        };
      case "container":
        return { ...block, id, blocks: normalizeBlocks(block.blocks, usedIds) };
      case "quiz":
        return {
          ...block,
          id,
          checkId: block.checkId.trim(),
          question: block.question.trim(),
          answer: block.answer.trim(),
          choices: block.choices.map((c) => c.trim()),
        };
      case "scenario":
        return {
          ...block,
          id,
          blocks: normalizeBlocks(block.blocks, usedIds),
          ...(block.blockId ? { blockId: block.blockId.trim() } : {}),
        };
      case "checklist":
        return { ...block, id, items: block.items.map((item) => item.trim()) };
      case "video":
        return {
          ...block,
          id,
          src: block.src.trim(),
          ...(block.title ? { title: block.title.trim() } : {}),
        };
      /* v8 ignore start -- exhaustive switch; unknown types come only from unsafe casts */
      default:
        return block;
      /* v8 ignore stop */
    }
  });
}

function normalizePages(pages: StudioPage[]): StudioPage[] {
  const usedPageIds = new Set<string>();
  return pages.map((page) => {
    const id = page.id.trim() || deriveId(page.title, usedPageIds);
    usedPageIds.add(id);
    const usedBlockIds = new Set<string>();
    return {
      id,
      title: page.title.trim(),
      blocks: normalizeBlocks(page.blocks, usedBlockIds),
    };
  });
}

export function normalizeStudioProject(project: StudioProjectV1): StudioProjectV1 {
  const usedPageIds = new Set<string>();
  const courseId =
    project.course.courseId.trim() ||
    deriveId(project.course.title || "course", usedPageIds);

  return {
    schemaVersion: studioSchemaVersion,
    course: {
      courseId,
      title: project.course.title.trim(),
    },
    pages: normalizePages(project.pages),
  };
}
