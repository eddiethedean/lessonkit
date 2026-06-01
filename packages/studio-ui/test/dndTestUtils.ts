import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

/** Minimal drag-end payload for tests (matches `applyDragEnd` input). */
export function dragEndStub(
  active: { id: string | number; data?: { current?: unknown } },
  over: { id: string | number } | null,
): Pick<DragEndEvent, "active" | "over"> {
  return { active, over } as Pick<DragEndEvent, "active" | "over">;
}

/** Minimal drag-end event for `onDragEnd` handlers. */
export function dragEndEventStub(
  active: { id: string | number; data?: { current?: unknown } },
  over: { id: string | number } | null,
): DragEndEvent {
  return dragEndStub(active, over) as unknown as DragEndEvent;
}

export function dragStartStub(active: { id: string | number }): DragStartEvent {
  return { active } as unknown as DragStartEvent;
}
