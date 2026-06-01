import type { LessonId } from "@lessonkit/core";
import type { StudioBlock, StudioPage, StudioProjectV1 } from "@lessonkit/studio-schema";
import { maxContainerNestingDepth } from "@lessonkit/studio-schema";
import type { BlockParentPath, BlockRef } from "./types";

export function getPage(project: StudioProjectV1, pageId: LessonId): StudioPage | undefined {
  return project.pages.find((p) => p.id === pageId);
}

export function collectBlockIds(project: StudioProjectV1): Set<string> {
  const ids = new Set<string>();
  const walk = (blocks: StudioBlock[]) => {
    for (const block of blocks) {
      ids.add(block.id);
      if (block.type === "container" || block.type === "scenario") {
        walk(block.blocks);
      }
    }
  };
  for (const page of project.pages) {
    walk(page.blocks);
  }
  return ids;
}

function getBlocksArray(blocks: StudioBlock[], parentPath: BlockParentPath): StudioBlock[] | null {
  let current: StudioBlock[] = blocks;
  for (const segment of parentPath) {
    const parent = current[segment];
    if (!parent || (parent.type !== "container" && parent.type !== "scenario")) {
      return null;
    }
    current = parent.blocks;
  }
  return current;
}

export function getBlocksAtPath(
  project: StudioProjectV1,
  pageId: LessonId,
  parentPath: BlockParentPath,
): StudioBlock[] | null {
  const page = getPage(project, pageId);
  if (!page) return null;
  if (parentPath.length > maxContainerNestingDepth) return null;
  return getBlocksArray(page.blocks, parentPath);
}

export function parentPathDepth(parentPath: BlockParentPath): number {
  return parentPath.length;
}

function cloneBlock(block: StudioBlock): StudioBlock {
  if (block.type === "container" || block.type === "scenario") {
    return { ...block, blocks: block.blocks.map(cloneBlock) };
  }
  return { ...block };
}

function setBlocksAtPathOnPage(
  page: StudioPage,
  parentPath: BlockParentPath,
  nextBlocks: StudioBlock[],
): StudioPage {
  if (parentPath.length === 0) {
    return { ...page, blocks: nextBlocks.map(cloneBlock) };
  }

  const updateNested = (blocks: StudioBlock[], pathIndex: number): StudioBlock[] => {
    const segment = parentPath[pathIndex]!;
    return blocks.map((block, i) => {
      if (i !== segment) return cloneBlock(block);
      if (block.type !== "container" && block.type !== "scenario") {
        /* v8 ignore next -- parent path must reference a nestable block */
        return block;
      }
      if (pathIndex === parentPath.length - 1) {
        return { ...block, blocks: nextBlocks.map(cloneBlock) };
      }
      return { ...block, blocks: updateNested(block.blocks, pathIndex + 1) };
    });
  };

  return { ...page, blocks: updateNested(page.blocks, 0) };
}

export function setBlocksAtPath(
  project: StudioProjectV1,
  pageId: LessonId,
  parentPath: BlockParentPath,
  nextBlocks: StudioBlock[],
): StudioProjectV1 {
  return {
    ...project,
    pages: project.pages.map((page) =>
      page.id === pageId ? setBlocksAtPathOnPage(page, parentPath, nextBlocks) : page,
    ),
  };
}

export function findBlockRef(
  project: StudioProjectV1,
  pageId: LessonId,
  blockId: string,
): BlockRef | null {
  const page = getPage(project, pageId);
  if (!page) return null;

  const search = (
    blocks: StudioBlock[],
    parentPath: BlockParentPath,
  ): BlockRef | null => {
    for (let index = 0; index < blocks.length; index += 1) {
      const block = blocks[index]!;
      if (block.id === blockId) {
        return { pageId, parentPath, index, block };
      }
      if (block.type === "container" || block.type === "scenario") {
        const found = search(block.blocks, [...parentPath, index]);
        if (found) return found;
      }
    }
    return null;
  };

  return search(page.blocks, []);
}

export function removeBlockFromProject(
  project: StudioProjectV1,
  pageId: LessonId,
  blockId: string,
): StudioProjectV1 | null {
  const ref = findBlockRef(project, pageId, blockId);
  if (!ref) return null;
  const siblings = getBlocksAtPath(project, pageId, ref.parentPath);
  /* v8 ignore next -- findBlockRef and getBlocksAtPath use the same tree coordinates */
  if (!siblings) return null;
  const next = siblings.filter((b) => b.id !== blockId);
  return setBlocksAtPath(project, pageId, ref.parentPath, next);
}

export function isNestableParent(block: StudioBlock | undefined): boolean {
  return block?.type === "container" || block?.type === "scenario";
}
