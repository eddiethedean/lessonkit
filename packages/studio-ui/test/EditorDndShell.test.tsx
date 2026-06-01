import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { StudioProjectV1 } from "@lessonkit/studio-schema";
import { createEditorStore } from "@lessonkit/studio-builder";
import { EditorDndShell } from "../src/EditorDndShell";

const project: StudioProjectV1 = {
  schemaVersion: 1,
  course: { courseId: "dnd-shell", title: "Dnd shell" },
  pages: [{ id: "lesson-1", title: "Lesson", blocks: [] }],
};

vi.mock("@dnd-kit/core", async (importOriginal) => {
  const original = await importOriginal<typeof import("@dnd-kit/core")>();
  return {
    ...original,
    DndContext: ({
      children,
      onDragStart,
      onDragEnd,
    }: {
      children: ReactNode;
      onDragStart?: (event: DragStartEvent) => void;
      onDragEnd?: (event: DragEndEvent) => void;
    }) => (
      <div data-testid="mock-dnd-context">
        <button
          type="button"
          data-testid="mock-drag-start"
          onClick={() => onDragStart?.({ active: { id: "palette:text" } } as DragStartEvent)}
        />
        <button
          type="button"
          data-testid="mock-drag-end"
          onClick={() =>
            onDragEnd?.({
              active: {
                id: "palette:text",
                data: { current: { source: "palette", blockType: "text" } },
              },
              over: { id: "drop__lesson-1__root" },
            } as DragEndEvent)
          }
        />
        {children}
      </div>
    ),
  };
});

describe("EditorDndShell", () => {
  afterEach(() => {
    cleanup();
  });

  it("invokes drag start and end handlers", () => {
    const store = createEditorStore(project);
    render(
      <EditorDndShell store={store} activePageId="lesson-1">
        <div data-testid="child">child</div>
      </EditorDndShell>,
    );
    fireEvent.click(screen.getByTestId("mock-drag-start"));
    fireEvent.click(screen.getByTestId("mock-drag-end"));
    expect(store.getState().project.pages[0]!.blocks.length).toBe(1);
  });
});
