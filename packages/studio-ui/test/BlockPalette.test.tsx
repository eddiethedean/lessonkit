import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { StudioProjectV1 } from "@lessonkit/studio-schema";
import { createEditorStore } from "@lessonkit/studio-builder";
import { useDraggable } from "@dnd-kit/core";
import { BlockPalette } from "../src/BlockPalette";

vi.mock("@dnd-kit/core", async (importOriginal) => {
  const original = await importOriginal<typeof import("@dnd-kit/core")>();
  return {
    ...original,
    useDraggable: vi.fn(() => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      isDragging: false,
    })),
  };
});

const project: StudioProjectV1 = {
  schemaVersion: 1,
  course: { courseId: "palette", title: "Palette" },
  pages: [{ id: "lesson-1", title: "Lesson", blocks: [] }],
};

describe("BlockPalette", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(useDraggable).mockReset();
  });

  it("inserts on Enter key on palette wrapper", () => {
    const store = createEditorStore(project);
    render(<BlockPalette store={store} />);
    const wrapper = screen.getByRole("button", { name: "text" }).parentElement!;
    fireEvent.keyDown(wrapper, { key: "Enter" });
    expect(store.getState().project.pages[0]!.blocks.length).toBe(1);
  });

  it("ignores other keys on palette wrapper", () => {
    const store = createEditorStore(project);
    render(<BlockPalette store={store} />);
    const wrapper = screen.getByRole("button", { name: "text" }).parentElement!;
    fireEvent.keyDown(wrapper, { key: "Tab" });
    expect(store.getState().project.pages[0]!.blocks).toHaveLength(0);
  });

  it("dims palette item while dragging", () => {
    vi.mocked(useDraggable).mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      isDragging: true,
    } as unknown as ReturnType<typeof useDraggable>);
    const store = createEditorStore(project);
    render(<BlockPalette store={store} />);
    const button = screen.getByRole("button", { name: "text" });
    expect(button.style.opacity).toBe("0.5");
  });

  it("inserts at index 0 when active page is missing", () => {
    const store = createEditorStore(project);
    store.setState({ activePageId: "missing-page" });
    render(<BlockPalette store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "text" }));
    expect(store.getState().project.pages[0]!.blocks).toHaveLength(0);
  });
});
