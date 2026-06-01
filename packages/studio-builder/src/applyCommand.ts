import { deriveId } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import type { StudioBlock, StudioProjectV1 } from "@lessonkit/studio-schema";
import { normalizeStudioProject } from "@lessonkit/studio-schema";
import type { EditorCommand } from "./types";
import {
  collectBlockIds,
  findBlockRef,
  getBlocksAtPath,
  getPage,
  parentPathDepth,
  removeBlockFromProject,
  setBlocksAtPath,
} from "./tree";
import { maxContainerNestingDepth } from "@lessonkit/studio-schema";

function cloneBlock(block: StudioBlock): StudioBlock {
  if (block.type === "container" || block.type === "scenario") {
    return { ...block, blocks: block.blocks.map(cloneBlock) };
  }
  return { ...block };
}

function applyProps(block: StudioBlock, props: Record<string, unknown>): StudioBlock {
  const next = { ...block, ...props } as StudioBlock;
  if (block.type === "container" || block.type === "scenario") {
    if (!("blocks" in props)) {
      (next as StudioBlock & { blocks: StudioBlock[] }).blocks = block.blocks;
    }
  }
  return next;
}

function updateBlockInProject(
  project: StudioProjectV1,
  pageId: LessonId,
  blockId: string,
  updater: (block: StudioBlock) => StudioBlock,
): StudioProjectV1 | null {
  const ref = findBlockRef(project, pageId, blockId);
  if (!ref) return null;
  const siblings = getBlocksAtPath(project, pageId, ref.parentPath);
  if (!siblings) return null;
  const next = siblings.map((b, i) => (i === ref.index ? updater(b) : b));
  return setBlocksAtPath(project, pageId, ref.parentPath, next);
}

export function applyCommand(
  project: StudioProjectV1,
  command: EditorCommand,
): { project: StudioProjectV1; selectionChanged: boolean } {
  if (command.type === "setSelection") {
    return { project, selectionChanged: true };
  }

  let next = project;

  switch (command.type) {
    case "insertBlock": {
      const siblings = getBlocksAtPath(next, command.pageId, command.parentPath);
      if (!siblings) break;
      /* v8 ignore start -- getBlocksAtPath rejects parentPath.length > max depth before siblings exist */
      if (parentPathDepth(command.parentPath) > maxContainerNestingDepth) break;
      /* v8 ignore stop */
      const list = [...siblings];
      const index = Math.max(0, Math.min(command.index, list.length));
      list.splice(index, 0, cloneBlock(command.block));
      next = setBlocksAtPath(next, command.pageId, command.parentPath, list);
      break;
    }
    case "deleteBlock": {
      const removed = removeBlockFromProject(next, command.pageId, command.blockId);
      if (removed) next = removed;
      break;
    }
    case "moveBlock": {
      const ref = findBlockRef(next, command.pageId, command.blockId);
      if (!ref) break;
      const fromSiblings = getBlocksAtPath(next, command.pageId, ref.parentPath);
      /* v8 ignore start -- findBlockRef implies siblings exist */
      if (!fromSiblings) break;
      /* v8 ignore stop */
      const block = fromSiblings[ref.index];
      /* v8 ignore start -- index comes from findBlockRef on the same siblings array */
      if (!block) break;
      /* v8 ignore stop */
      if (parentPathDepth(command.toParentPath) > maxContainerNestingDepth) break;
      const without = fromSiblings.filter((_, i) => i !== ref.index);
      const withoutSource = setBlocksAtPath(next, command.pageId, ref.parentPath, without);
      const toSiblings = getBlocksAtPath(withoutSource, command.pageId, command.toParentPath);
      if (!toSiblings) break;
      const toList = [...toSiblings];
      const toIndex = Math.max(0, Math.min(command.toIndex, toList.length));
      toList.splice(toIndex, 0, cloneBlock(block));
      next = setBlocksAtPath(withoutSource, command.pageId, command.toParentPath, toList);
      break;
    }
    case "updateBlockProps": {
      const updated = updateBlockInProject(next, command.pageId, command.blockId, (b) =>
        applyProps(b, command.props),
      );
      if (updated) next = updated;
      break;
    }
    case "addPage": {
      const used = new Set(next.pages.map((p) => p.id));
      const id = command.pageId ?? deriveId(command.title ?? "page", used);
      const title = command.title ?? "New page";
      next = {
        ...next,
        pages: [...next.pages, { id, title, blocks: [] }],
      };
      break;
    }
    case "deletePage": {
      if (next.pages.length <= 1) break;
      next = { ...next, pages: next.pages.filter((p) => p.id !== command.pageId) };
      break;
    }
    case "renamePage": {
      next = {
        ...next,
        pages: next.pages.map((p) =>
          p.id === command.pageId ? { ...p, title: command.title } : p,
        ),
      };
      break;
    }
    case "reorderPage": {
      const idx = next.pages.findIndex((p) => p.id === command.pageId);
      if (idx < 0) break;
      const pages = [...next.pages];
      const [page] = pages.splice(idx, 1);
      /* v8 ignore start -- splice returns element when idx is in range */
      if (!page) break;
      /* v8 ignore stop */
      const to = Math.max(0, Math.min(command.toIndex, pages.length));
      pages.splice(to, 0, page);
      next = { ...next, pages };
      break;
    }
    case "setActivePage":
      break;
    /* v8 ignore next 2 */
    default:
      break;
  }

  return { project: normalizeStudioProject(next), selectionChanged: false };
}

export function resolveSelectionAfterCommand(
  project: StudioProjectV1,
  command: EditorCommand,
  priorSelection: import("./types").EditorSelection,
): import("./types").EditorSelection {
  if (command.type === "setSelection") return command.selection;
  if (command.type === "setActivePage") {
    return { kind: "page", pageId: command.pageId };
  }
  if (command.type === "insertBlock") {
    return {
      kind: "block",
      pageId: command.pageId,
      blockId: command.block.id,
      parentPath: command.parentPath,
    };
  }
  if (command.type === "updateBlockProps") {
    return {
      kind: "block",
      pageId: command.pageId,
      blockId: command.blockId,
      parentPath:
        priorSelection.kind === "block" && priorSelection.blockId === command.blockId
          ? priorSelection.parentPath
          : (findBlockRef(project, command.pageId, command.blockId)?.parentPath ?? []),
    };
  }
  if (command.type === "deleteBlock") {
    if (priorSelection.kind === "block" && priorSelection.blockId === command.blockId) {
      return { kind: "page", pageId: command.pageId };
    }
    return priorSelection;
  }
  if (command.type === "deletePage" && priorSelection.kind !== "none") {
    const pageId =
      priorSelection.kind === "page" ? priorSelection.pageId : priorSelection.pageId;
    if (pageId === command.pageId) {
      const first = project.pages[0];
      return first ? { kind: "page", pageId: first.id } : { kind: "none" };
    }
  }
  if (command.type === "addPage") {
    const last = project.pages[project.pages.length - 1];
    if (!last) return priorSelection;
    return { kind: "page", pageId: last.id };
  }
  return priorSelection;
}

export function resolveActivePageAfterCommand(
  project: StudioProjectV1,
  command: EditorCommand,
  priorActive: LessonId,
): LessonId {
  if (command.type === "setActivePage") return command.pageId;
  if (command.type === "deletePage" && priorActive === command.pageId) {
    return project.pages[0]?.id ?? priorActive;
  }
  if (command.type === "addPage") {
    return project.pages[project.pages.length - 1]?.id ?? priorActive;
  }
  if (!getPage(project, priorActive)) {
    return project.pages[0]?.id ?? priorActive;
  }
  return priorActive;
}

export { collectBlockIds };
