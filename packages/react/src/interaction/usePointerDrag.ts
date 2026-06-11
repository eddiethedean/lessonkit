import { useCallback, useRef, useState } from "react";
import { DEFAULT_DROP_ATTR, resolveDropTargetAtPoint } from "./resolveDropTarget";

export type UsePointerDragOptions = {
  dropAttribute?: string;
  onHover?: (dropId: string | null) => void;
  onDrop: (itemId: string, dropId: string) => void;
  /** Called when drag ends over pool or outside any drop zone while item was on a target. */
  onReturnToPool?: (itemId: string, clientX: number, clientY: number) => void;
  canStart?: (itemId: string) => boolean;
};

export function usePointerDrag(options: UsePointerDragOptions) {
  const dropAttribute = options.dropAttribute ?? DEFAULT_DROP_ATTR;
  const draggingRef = useRef<string | null>(null);
  const droppedRef = useRef(false);
  const movedRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [hoverDropId, setHoverDropId] = useState<string | null>(null);

  const setHover = useCallback(
    (dropId: string | null) => {
      setHoverDropId(dropId);
      options.onHover?.(dropId);
    },
    [options],
  );

  const start = useCallback(
    (event: React.PointerEvent, itemId: string) => {
      if (event.button !== 0) return;
      if (options.canStart && !options.canStart(itemId)) return;
      droppedRef.current = false;
      movedRef.current = false;
      startPointRef.current = { x: event.clientX, y: event.clientY };
      draggingRef.current = itemId;
      setDraggingItemId(itemId);
      event.currentTarget.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    },
    [options],
  );

  const move = useCallback(
    (event: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const start = startPointRef.current;
      if (start) {
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.hypot(dx, dy) > 6) movedRef.current = true;
      }
      const dropId = resolveDropTargetAtPoint(event.clientX, event.clientY, dropAttribute);
      setHover(dropId);
    },
    [dropAttribute, setHover],
  );

  const end = useCallback(
    (event: React.PointerEvent) => {
      const itemId = draggingRef.current;
      if (!itemId) return;
      const dropId = resolveDropTargetAtPoint(event.clientX, event.clientY, dropAttribute);
      if (dropId && dropId !== "pool") {
        droppedRef.current = true;
        options.onDrop(itemId, dropId);
      } else if (dropId === "pool" || dropId === null) {
        options.onReturnToPool?.(itemId, event.clientX, event.clientY);
      }
      draggingRef.current = null;
      startPointRef.current = null;
      setDraggingItemId(null);
      setHover(null);
    },
    [dropAttribute, options, setHover],
  );

  const cancel = useCallback(() => {
    draggingRef.current = null;
    startPointRef.current = null;
    setDraggingItemId(null);
    setHover(null);
  }, [setHover]);

  const shouldSuppressClick = useCallback(() => movedRef.current || droppedRef.current, []);

  return {
    draggingItemId,
    hoverDropId,
    droppedRef,
    shouldSuppressClick,
    start,
    move,
    end,
    cancel,
  };
}
