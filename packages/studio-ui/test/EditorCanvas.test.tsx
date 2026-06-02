import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { StudioProjectV1 } from "@lessonkit/studio-schema";
import { createEditorStore } from "@lessonkit/studio-builder";
import { useSortable } from "@dnd-kit/sortable";
import { EditorCanvas } from "../src/EditorCanvas";

vi.mock("@dnd-kit/sortable", async (importOriginal) => {
  const original = await importOriginal<typeof import("@dnd-kit/sortable")>();
  return {
    ...original,
    useSortable: vi.fn(() => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    })),
  };
});

const project: StudioProjectV1 = {
  schemaVersion: 1,
  course: { courseId: "canvas", title: "Canvas" },
  pages: [
    {
      id: "lesson-1",
      title: "Lesson",
      blocks: [
        { type: "text", id: "text-1", text: "Body" },
        { type: "scenario", id: "sc-1", blocks: [] },
      ],
    },
  ],
};

describe("EditorCanvas", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(useSortable).mockReset();
  });

  it("selects page when canvas background is clicked", () => {
    const store = createEditorStore(project);
    store.getState().dispatch({
      type: "setSelection",
      selection: { kind: "block", pageId: "lesson-1", blockId: "text-1", parentPath: [] },
    });
    render(<EditorCanvas store={store} />);
    fireEvent.click(screen.getByTestId("studio-canvas"));
    expect(store.getState().selection).toEqual({ kind: "page", pageId: "lesson-1" });
  });

  it("shows empty drop zone styling", () => {
    const store = createEditorStore({
      ...project,
      pages: [{ id: "lesson-1", title: "Lesson", blocks: [] }],
    });
    render(<EditorCanvas store={store} />);
    expect(document.querySelector(".lk-studio-drop-zone--empty")).toBeTruthy();
    expect(screen.getByText(/Drag blocks here/i)).toBeDefined();
  });

  it("dims block row while dragging", () => {
    vi.mocked(useSortable).mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: true,
    } as unknown as ReturnType<typeof useSortable>);
    const store = createEditorStore(project);
    render(<EditorCanvas store={store} />);
    const block = screen.getByText("Body").closest(".lk-studio-block-wrap") as HTMLElement;
    expect(block.style.opacity).toBe("0.4");
  });

  it("uses full opacity when not dragging", () => {
    const store = createEditorStore(project);
    render(<EditorCanvas store={store} />);
    const block = screen.getByText("Body").closest(".lk-studio-block-wrap") as HTMLElement;
    expect(block.style.opacity).toBe("1");
  });

  it("ignores non-Enter keys on block rows", () => {
    const store = createEditorStore(project);
    render(<EditorCanvas store={store} />);
    const block = screen.getByText("Body").closest('[role="button"]') as HTMLElement;
    store.getState().dispatch({ type: "setSelection", selection: { kind: "none" } });
    fireEvent.keyDown(block, { key: "Escape" });
    expect(store.getState().selection.kind).toBe("none");
  });

  it("renders nested scenario blocks", () => {
    const store = createEditorStore(project);
    render(<EditorCanvas store={store} />);
    const canvas = screen.getByTestId("studio-canvas");
    expect(within(canvas).getByLabelText("Scenario")).toBeDefined();
    expect(canvas.querySelector(".lk-studio-nested")).toBeTruthy();
  });

  it("virtualizes large root block lists", () => {
    const blocks = Array.from({ length: 32 }, (_, index) => ({
      type: "text" as const,
      id: `text-${index}`,
      text: `Block ${index}`,
    }));
    const store = createEditorStore({
      ...project,
      pages: [{ id: "lesson-1", title: "Large", blocks }],
    });
    render(<EditorCanvas store={store} />);
    expect(document.querySelector(".lk-studio-drop-zone--virtual")).toBeTruthy();
    expect(document.querySelector(".lk-studio-virtual-scroll")).toBeTruthy();
  });
});
