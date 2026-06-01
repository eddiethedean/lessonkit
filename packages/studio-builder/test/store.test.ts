import { describe, expect, it, vi } from "vitest";
import { createDefaultBlock } from "../src/defaults";
import { createEditorStore } from "../src/store";
import { findBlockRef } from "../src/tree";
import { sampleProject } from "./fixtures";

describe("createEditorStore", () => {
  it("inserts, updates, deletes blocks with undo/redo", () => {
    const store = createEditorStore(sampleProject);
    const block = createDefaultBlock("text", store.getState().collectBlockIds());

    expect(store.getState().dispatch({
      type: "insertBlock",
      pageId: "lesson-1",
      parentPath: [],
      index: 0,
      block,
    }).ok).toBe(true);

    expect(store.getState().project.pages[0]!.blocks[0]!.id).toBe(block.id);
    expect(store.getState().canUndo).toBe(true);

    store.getState().undo();
    expect(store.getState().project.pages[0]!.blocks).toHaveLength(2);

    store.getState().redo();
    expect(store.getState().project.pages[0]!.blocks[0]!.id).toBe(block.id);
  });

  it("updates block props", () => {
    const store = createEditorStore(sampleProject);
    expect(store.getState().dispatch({
      type: "updateBlockProps",
      pageId: "lesson-1",
      blockId: "h1",
      props: { text: "Updated" },
    }).ok).toBe(true);
    expect(store.getState().project.pages[0]!.blocks[0]).toMatchObject({
      type: "heading",
      text: "Updated",
    });
  });

  it("rejects invalid quiz update", () => {
    const store = createEditorStore(sampleProject);
    store.getState().dispatch({
      type: "insertBlock",
      pageId: "lesson-1",
      parentPath: [],
      index: 0,
      block: createDefaultBlock("quiz", store.getState().collectBlockIds()),
    });
    const quiz = store.getState().project.pages[0]!.blocks[0]!;
    expect(quiz.type).toBe("quiz");

    const result = store.getState().dispatch({
      type: "updateBlockProps",
      pageId: "lesson-1",
      blockId: quiz.id,
      props: { answer: "Not a choice" },
    });
    expect(result.ok).toBe(false);
  });

  it("manages pages", () => {
    const store = createEditorStore(sampleProject);
    store.getState().dispatch({ type: "addPage", title: "Lesson 3" });
    expect(store.getState().project.pages).toHaveLength(3);
    const newId = store.getState().project.pages[2]!.id;
    store.getState().dispatch({ type: "setActivePage", pageId: newId });
    expect(store.getState().activePageId).toBe(newId);
    store.getState().dispatch({ type: "renamePage", pageId: newId, title: "Renamed" });
    expect(store.getState().project.pages[2]!.title).toBe("Renamed");
    store.getState().dispatch({ type: "reorderPage", pageId: newId, toIndex: 0 });
    expect(store.getState().project.pages[0]!.id).toBe(newId);
    store.getState().dispatch({ type: "deletePage", pageId: newId });
    expect(store.getState().project.pages).toHaveLength(2);
  });

  it("does not delete last page", () => {
    const store = createEditorStore({
      ...sampleProject,
      pages: [sampleProject.pages[0]!],
    });
    store.getState().dispatch({ type: "deletePage", pageId: "lesson-1" });
    expect(store.getState().project.pages).toHaveLength(1);
  });

  it("moves blocks within page", () => {
    const store = createEditorStore(sampleProject);
    store.getState().dispatch({
      type: "moveBlock",
      pageId: "lesson-1",
      blockId: "t1",
      toParentPath: [],
      toIndex: 0,
    });
    expect(store.getState().project.pages[0]!.blocks[0]!.id).toBe("t1");
  });

  it("replaceProject can preserve history", () => {
    const store = createEditorStore(sampleProject);
    store.getState().dispatch({
      type: "updateBlockProps",
      pageId: "lesson-1",
      blockId: "h1",
      props: { text: "X" },
    });
    store.getState().replaceProject(sampleProject);
    expect(store.getState().canUndo).toBe(true);
  });

  it("replaceProject resets dirty state", () => {
    const store = createEditorStore(sampleProject);
    store.getState().dispatch({
      type: "updateBlockProps",
      pageId: "lesson-1",
      blockId: "h1",
      props: { text: "X" },
    });
    expect(store.getState().isDirty).toBe(true);
    store.getState().replaceProject(sampleProject, { resetHistory: true });
    expect(store.getState().isDirty).toBe(false);
    expect(store.getState().canUndo).toBe(false);
  });

  it("subscribeAutosave debounces", () => {
    vi.useFakeTimers();
    const store = createEditorStore(sampleProject);
    const onSave = vi.fn();
    store.getState().subscribeAutosave(onSave, { debounceMs: 100 });
    store.getState().dispatch({
      type: "updateBlockProps",
      pageId: "lesson-1",
      blockId: "h1",
      props: { text: "Autosaved" },
    });
    vi.advanceTimersByTime(150);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(store.getState().isDirty).toBe(false);
    vi.useRealTimers();
  });

  it("setSelection does not affect undo stack", () => {
    const store = createEditorStore(sampleProject);
    store.getState().dispatch({ type: "setSelection", selection: { kind: "none" } });
    expect(store.getState().canUndo).toBe(false);
  });

  it("replaceProject with empty pages clears active page id", () => {
    const store = createEditorStore(sampleProject);
    store.getState().replaceProject({ ...sampleProject, pages: [] });
    expect(store.getState().activePageId).toBe("");
  });
});

describe("tree helpers", () => {
  it("findBlockRef locates nested blocks", () => {
    const project = {
      ...sampleProject,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            {
              type: "container" as const,
              id: "c1",
              blocks: [{ type: "text" as const, id: "nested", text: "N" }],
            },
          ],
        },
      ],
    };
    const ref = findBlockRef(project, "lesson-1", "nested");
    expect(ref?.parentPath).toEqual([0]);
  });
});

describe("createDefaultBlock", () => {
  it("throws for unknown type", () => {
    expect(() => createDefaultBlock("unknown")).toThrow(/Unknown studio block type/);
  });

  it("creates all catalog block types", () => {
    const types = [
      "text",
      "heading",
      "image",
      "button",
      "input",
      "container",
      "quiz",
      "scenario",
      "checklist",
      "video",
    ] as const;
    const used = new Set<string>();
    for (const type of types) {
      const block = createDefaultBlock(type, used);
      used.add(block.id);
      expect(block.type).toBe(type);
    }
  });
});
