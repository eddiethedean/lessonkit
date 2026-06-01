import {
  createDefaultBlock,
  findBlockRef,
  getBlocksAtPath,
  type BlockParentPath,
  type EditorCommand,
} from "@lessonkit/studio-builder";
import type { StudioBlock, StudioProjectV1 } from "@lessonkit/studio-schema";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { StoreApi } from "zustand/vanilla";
import type { EditorStoreState } from "@lessonkit/studio-builder";

export function dropZoneId(pageId: string, parentPath: BlockParentPath): string {
  const suffix = parentPath.length ? parentPath.join("_") : "root";
  return `drop__${pageId}__${suffix}`;
}

export function parseDropZoneId(id: string): { pageId: string; parentPath: BlockParentPath } | null {
  if (!id.startsWith("drop__")) return null;
  const parts = id.split("__");
  if (parts.length < 3) return null;
  const pageId = parts[1]!;
  const pathPart = parts.slice(2).join("__");
  if (pathPart === "root") return { pageId, parentPath: [] };
  const parentPath = pathPart.split("_").map((n) => Number.parseInt(n, 10));
  if (parentPath.some((n) => Number.isNaN(n))) return null;
  return { pageId, parentPath };
}

function isNestable(block: StudioBlock): block is StudioBlock & { blocks: StudioBlock[] } {
  return block.type === "container" || block.type === "scenario";
}

export function resolveInsertTarget(
  overId: string,
  project: StudioProjectV1,
  pageId: string,
  fromPalette: boolean,
): { parentPath: BlockParentPath; index: number } | null {
  const drop = parseDropZoneId(overId);
  if (drop && drop.pageId === pageId) {
    const siblings = getBlocksAtPath(project, pageId, drop.parentPath);
    return { parentPath: drop.parentPath, index: siblings?.length ?? 0 };
  }

  const ref = findBlockRef(project, pageId, overId);
  if (!ref) return null;

  if (fromPalette && isNestable(ref.block)) {
    return {
      parentPath: [...ref.parentPath, ref.index],
      index: ref.block.blocks.length,
    };
  }

  return { parentPath: ref.parentPath, index: ref.index };
}

export function applyDragEnd(
  event: Pick<DragEndEvent, "active" | "over">,
  options: {
    activePageId: string;
    project: StudioProjectV1;
    collectBlockIds: () => Set<string>;
    dispatch: (command: EditorCommand) => void;
  },
): void {
  const { active, over } = event;
  if (!over) return;

  const page = options.project.pages.find((p) => p.id === options.activePageId);
  if (!page) return;

  const activeData = active.data.current as
    | { source: "palette"; blockType: string }
    | { source: "canvas"; blockId: string; pageId: string }
    | undefined;

  const overId = String(over.id);

  if (activeData?.source === "palette") {
    const block = createDefaultBlock(activeData.blockType, options.collectBlockIds());
    const target = resolveInsertTarget(overId, options.project, options.activePageId, true);
    if (!target) return;
    options.dispatch({
      type: "insertBlock",
      pageId: options.activePageId,
      parentPath: target.parentPath,
      index: target.index,
      block,
    });
    return;
  }

  if (activeData?.source === "canvas" && active.id !== over.id) {
    const target = resolveInsertTarget(overId, options.project, options.activePageId, false);
    if (!target) return;
    options.dispatch({
      type: "moveBlock",
      pageId: options.activePageId,
      blockId: String(active.id),
      toParentPath: target.parentPath,
      toIndex: target.index,
    });
  }
}

export function createEditorDndHandlers(
  store: StoreApi<EditorStoreState>,
  activePageId: string,
) {
  return {
    onDragStart(event: DragStartEvent): string {
      return String(event.active.id);
    },
    onDragEnd(event: DragEndEvent, setActiveDrag: (id: string | null) => void): void {
      setActiveDrag(null);
      applyDragEnd(event, {
        activePageId,
        project: store.getState().project,
        collectBlockIds: () => store.getState().collectBlockIds(),
        dispatch: (command) => store.getState().dispatch(command),
      });
    },
  };
}
