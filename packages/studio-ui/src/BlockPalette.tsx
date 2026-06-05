import { buildStudioBlockCatalog } from "@lessonkit/studio-schema";
import { createDefaultBlock } from "@lessonkit/studio-builder";
import type { EditorStoreState } from "@lessonkit/studio-builder";
import type { StoreApi } from "zustand/vanilla";
import { useDraggable } from "@dnd-kit/core";

const catalog = buildStudioBlockCatalog();

type BlockPaletteProps = {
  store: StoreApi<EditorStoreState>;
};

function PaletteItem({ type, label }: { type: string; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { source: "palette", blockType: type },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className="lk-studio-palette-item"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      {...listeners}
      {...attributes}
      onClick={() => {
        /* click handled in parent via data attribute fallback */
      }}
    >
      {label}
    </button>
  );
}

export function BlockPalette({ store }: BlockPaletteProps) {
  const activePageId = store.getState().activePageId;

  const insertType = (blockType: string) => {
    const block = createDefaultBlock(blockType, store.getState().collectBlockIds());
    const page = store.getState().project.pages.find((p) => p.id === activePageId);
    const index = page?.blocks.length ?? 0;
    store.getState().dispatch({
      type: "insertBlock",
      pageId: activePageId,
      parentPath: [],
      index,
      block,
    });
  };

  return (
    <div>
      <h2 style={{ fontSize: "0.875rem", margin: "0 0 0.5rem" }}>Blocks</h2>
      {catalog.entries.map((entry) => (
        <div
          key={entry.type}
          onClick={() => insertType(entry.type)}
          onKeyDown={(e) => {
            if (e.key === "Enter") insertType(entry.type);
          }}
          role="presentation"
        >
          <PaletteItem type={entry.type} label={entry.displayName ?? entry.type} />
        </div>
      ))}
    </div>
  );
}
