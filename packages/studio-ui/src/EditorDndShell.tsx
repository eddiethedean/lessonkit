import React, { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { EditorStoreState } from "@lessonkit/studio-builder";
import type { StoreApi } from "zustand/vanilla";
import { DragOverlayContent } from "./DragOverlayContent";
import { createEditorDndHandlers } from "./dndTargets";

export { dropZoneId, parseDropZoneId, resolveInsertTarget } from "./dndTargets";

export function EditorDndShell({
  store,
  activePageId,
  children,
}: {
  store: StoreApi<EditorStoreState>;
  activePageId: string;
  children: React.ReactNode;
}) {
  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const handlers = useMemo(
    () => createEditorDndHandlers(store, activePageId),
    [store, activePageId],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveDrag(handlers.onDragStart(event))}
      onDragEnd={(event) => handlers.onDragEnd(event, setActiveDrag)}
    >
      <div className="lk-studio-dnd-shell">{children}</div>
      <DragOverlay>
        <DragOverlayContent activeDrag={activeDrag} />
      </DragOverlay>
    </DndContext>
  );
}
