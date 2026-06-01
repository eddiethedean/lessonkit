import React, { useMemo } from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { BlockParentPath, EditorStoreState } from "@lessonkit/studio-builder";
import { renderBlock } from "@lessonkit/studio-renderer";
import type { StudioBlock } from "@lessonkit/studio-schema";
import type { StoreApi } from "zustand/vanilla";
import { dropZoneId } from "./dndTargets";
import { useEditorStore } from "./useEditorStore";

type EditorCanvasProps = {
  store: StoreApi<EditorStoreState>;
};

function SortableBlockRow({
  block,
  index,
  pageId,
  parentPath,
  selected,
  onSelect,
  store,
  activePageId,
  selection,
}: {
  block: StudioBlock;
  index: number;
  pageId: string;
  parentPath: BlockParentPath;
  selected: boolean;
  onSelect: () => void;
  store: StoreApi<EditorStoreState>;
  activePageId: string;
  selection: EditorStoreState["selection"];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { source: "canvas", blockId: block.id, pageId, parentPath },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const childPath: BlockParentPath = [...parentPath, index];
  const isContainer = block.type === "container" || block.type === "scenario";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`lk-studio-block-wrap${selected ? " lk-studio-block-wrap--selected" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect();
      }}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
    >
      {renderBlock(block)}
      {isContainer ? (
        <div className="lk-studio-nested">
          <CanvasBlockList
            blocks={block.blocks}
            parentPath={childPath}
            pageId={pageId}
            store={store}
            activePageId={activePageId}
            selection={selection}
          />
        </div>
      ) : null}
    </div>
  );
}

function CanvasBlockList({
  blocks,
  parentPath,
  pageId,
  store,
  activePageId,
  selection,
}: {
  blocks: StudioBlock[];
  parentPath: BlockParentPath;
  pageId: string;
  store: StoreApi<EditorStoreState>;
  activePageId: string;
  selection: EditorStoreState["selection"];
}) {
  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);
  const { setNodeRef } = useDroppable({
    id: dropZoneId(pageId, parentPath),
    data: { source: "dropZone", pageId, parentPath },
  });

  return (
    <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`lk-studio-drop-zone${blocks.length === 0 ? " lk-studio-drop-zone--empty" : ""}`}
      >
        {blocks.map((block, index) => (
          <SortableBlockRow
            key={block.id}
            block={block}
            index={index}
            pageId={pageId}
            parentPath={parentPath}
            selected={
              selection.kind === "block" &&
              selection.blockId === block.id &&
              selection.pageId === pageId
            }
            onSelect={() =>
              store.getState().dispatch({
                type: "setSelection",
                selection: {
                  kind: "block",
                  pageId: activePageId,
                  blockId: block.id,
                  parentPath,
                },
              })
            }
            store={store}
            activePageId={activePageId}
            selection={selection}
          />
        ))}
      </div>
    </SortableContext>
  );
}

export function EditorCanvas({ store }: EditorCanvasProps) {
  const project = useEditorStore(store, (s) => s.project);
  const activePageId = useEditorStore(store, (s) => s.activePageId);
  const selection = useEditorStore(store, (s) => s.selection);

  const page = project.pages.find((p) => p.id === activePageId);

  if (!page) {
    return <p>No active page.</p>;
  }

  return (
    <div
      className="lk-studio-canvas"
      data-testid="studio-canvas"
      onClick={() =>
        store.getState().dispatch({
          type: "setSelection",
          selection: { kind: "page", pageId: activePageId },
        })
      }
      onKeyDown={() => {}}
      role="presentation"
    >
      <h2 style={{ fontSize: "1rem", marginTop: 0 }}>{page.title}</h2>
      <CanvasBlockList
        blocks={page.blocks}
        parentPath={[]}
        pageId={activePageId}
        store={store}
        activePageId={activePageId}
        selection={selection}
      />
      {page.blocks.length === 0 ? (
        <p style={{ fontSize: "0.875rem", opacity: 0.7 }}>Drag blocks here or click the palette.</p>
      ) : null}
    </div>
  );
}
