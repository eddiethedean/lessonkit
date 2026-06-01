import { describe, expect, it, vi } from "vitest";
import type { EditorCommand } from "../src/types";
import {
  applyCommand,
  collectBlockIds,
  resolveActivePageAfterCommand,
  resolveSelectionAfterCommand,
} from "../src/applyCommand";
import { createDefaultBlock } from "../src/defaults";
import { subscribeAutosave } from "../src/autosave";
import { createEditorStore } from "../src/store";
import {
  findBlockRef,
  getBlocksAtPath,
  isNestableParent,
  parentPathDepth,
  removeBlockFromProject,
  setBlocksAtPath,
} from "../src/tree";
import type { StudioBlock, StudioProjectV1 } from "@lessonkit/studio-schema";
import { sampleProject } from "./fixtures";

/** Build a page whose innermost block sits at parentPath length `depth`. */
function deepNestedProject(depth: number, innerBlockId = "deep-text"): StudioProjectV1 {
  let inner: StudioBlock = { type: "text", id: innerBlockId, text: "deep" };
  for (let level = depth - 1; level >= 0; level -= 1) {
    inner = { type: "container", id: `c${level}`, blocks: [inner] };
  }
  return {
    ...sampleProject,
    pages: [{ id: "lesson-1", title: "Deep", blocks: [inner] }],
  };
}

describe("applyCommand edge cases", () => {
  it("setSelection returns selectionChanged", () => {
    const result = applyCommand(sampleProject, {
      type: "setSelection",
      selection: { kind: "none" },
    });
    expect(result.selectionChanged).toBe(true);
  });

  it("deleteBlock no-op when missing", () => {
    const { project } = applyCommand(sampleProject, {
      type: "deleteBlock",
      pageId: "lesson-1",
      blockId: "missing",
    });
    expect(project).toEqual(sampleProject);
  });

  it("deleteBlock removes an existing block", () => {
    const { project } = applyCommand(sampleProject, {
      type: "deleteBlock",
      pageId: "lesson-1",
      blockId: "h1",
    });
    expect(project.pages[0]!.blocks).toHaveLength(1);
    expect(project.pages[0]!.blocks[0]?.id).toBe("t1");
  });

  it("no-ops invalid insert paths", () => {
    const { project } = applyCommand(sampleProject, {
      type: "insertBlock",
      pageId: "missing",
      parentPath: [],
      index: 0,
      block: createDefaultBlock("text"),
    });
    expect(project).toEqual(sampleProject);
  });

  it("no-ops move when block missing", () => {
    const { project } = applyCommand(sampleProject, {
      type: "moveBlock",
      pageId: "lesson-1",
      blockId: "missing",
      toParentPath: [],
      toIndex: 0,
    });
    expect(project.pages[0]!.blocks).toHaveLength(2);
  });

  it("moves block into container", () => {
    const withContainer = {
      ...sampleProject,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            { type: "container" as const, id: "c1", blocks: [] },
            { type: "text" as const, id: "t1", text: "a" },
          ],
        },
      ],
    };
    const { project } = applyCommand(withContainer, {
      type: "moveBlock",
      pageId: "lesson-1",
      blockId: "t1",
      toParentPath: [0],
      toIndex: 0,
    });
    const container = project.pages[0]!.blocks[0];
    expect(container?.type).toBe("container");
    if (container?.type === "container") {
      expect(container.blocks[0]?.id).toBe("t1");
    }
  });

  it("skips insert when parent path too deep or invalid", () => {
    const block = createDefaultBlock("text");
    const deepParent = Array.from({ length: 9 }, () => 0);
    const { project } = applyCommand(sampleProject, {
      type: "insertBlock",
      pageId: "lesson-1",
      parentPath: deepParent,
      index: 0,
      block,
    });
    expect(project.pages[0]!.blocks).toHaveLength(2);

    const { project: p2 } = applyCommand(sampleProject, {
      type: "insertBlock",
      pageId: "lesson-1",
      parentPath: [0],
      index: 0,
      block,
    });
    expect(p2.pages[0]!.blocks).toHaveLength(2);
  });

  it("skips move when target parent path exceeds max depth", () => {
    const { project } = applyCommand(sampleProject, {
      type: "moveBlock",
      pageId: "lesson-1",
      blockId: "h1",
      toParentPath: Array.from({ length: 9 }, () => 0),
      toIndex: 0,
    });
    expect(project.pages[0]!.blocks.some((b) => b.id === "h1")).toBe(true);
  });

  it("skips move when target path invalid or too deep", () => {
    const { project } = applyCommand(sampleProject, {
      type: "moveBlock",
      pageId: "lesson-1",
      blockId: "h1",
      toParentPath: [99],
      toIndex: 0,
    });
    expect(project.pages[0]!.blocks).toHaveLength(2);
    expect(project.pages[0]!.blocks.some((b) => b.id === "h1")).toBe(true);

    const deep = Array.from({ length: 9 }, () => 0);
    const { project: p2 } = applyCommand(sampleProject, {
      type: "moveBlock",
      pageId: "lesson-1",
      blockId: "h1",
      toParentPath: deep,
      toIndex: 0,
    });
    expect(p2.pages[0]!.blocks.some((b) => b.id === "h1")).toBe(true);
  });

  it("skips reorderPage for unknown page", () => {
    const { project } = applyCommand(sampleProject, {
      type: "reorderPage",
      pageId: "missing",
      toIndex: 0,
    });
    expect(project.pages).toHaveLength(2);
  });

  it("handles unknown command type in applyCommand switch default", () => {
    const { project } = applyCommand(sampleProject, {
      type: "unknown",
    } as unknown as EditorCommand);
    expect(project).toEqual(sampleProject);
  });

  it("applyCommand setActivePage is a no-op on project", () => {
    const { project, selectionChanged } = applyCommand(sampleProject, {
      type: "setActivePage",
      pageId: "lesson-2",
    });
    expect(project).toEqual(sampleProject);
    expect(selectionChanged).toBe(false);
  });

  it("addPage accepts explicit pageId and default title", () => {
    const withId = applyCommand(sampleProject, {
      type: "addPage",
      pageId: "custom-page",
    }).project;
    expect(withId.pages.at(-1)).toMatchObject({ id: "custom-page", title: "New page" });

    const withTitle = applyCommand(sampleProject, { type: "addPage", title: "Named" }).project;
    expect(withTitle.pages.at(-1)?.title).toBe("Named");

    const derived = applyCommand(sampleProject, { type: "addPage" }).project;
    expect(derived.pages.at(-1)?.title).toBe("New page");
    expect(derived.pages.at(-1)?.id).toBeTruthy();
  });

  it("updateBlockProps no-op when siblings path is out of range", () => {
    const deep = deepNestedProject(9);
    const { project } = applyCommand(deep, {
      type: "updateBlockProps",
      pageId: "lesson-1",
      blockId: "deep-text",
      props: { text: "nope" },
    });
    expect(project).toEqual(deep);
  });

  it("preserves nested blocks when updating container without blocks prop", () => {
    const withContainer = {
      ...sampleProject,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            {
              type: "container" as const,
              id: "c1",
              blocks: [{ type: "text" as const, id: "inner", text: "keep" }],
            },
          ],
        },
      ],
    };
    const { project } = applyCommand(withContainer, {
      type: "updateBlockProps",
      pageId: "lesson-1",
      blockId: "c1",
      props: {},
    });
    const container = project.pages[0]!.blocks[0];
    expect(container?.type).toBe("container");
    if (container?.type === "container") {
      expect(container.blocks[0]?.id).toBe("inner");
    }
  });

  it("replaces container children when blocks prop is supplied", () => {
    const withContainer = {
      ...sampleProject,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            {
              type: "container" as const,
              id: "c1",
              blocks: [{ type: "text" as const, id: "inner", text: "old" }],
            },
          ],
        },
      ],
    };
    const { project } = applyCommand(withContainer, {
      type: "updateBlockProps",
      pageId: "lesson-1",
      blockId: "c1",
      props: {
        blocks: [{ type: "text", id: "replaced", text: "new" }],
      },
    });
    const container = project.pages[0]!.blocks[0];
    expect(container?.type).toBe("container");
    if (container?.type === "container") {
      expect(container.blocks[0]?.id).toBe("replaced");
    }
  });

  it("clones nested blocks when inserting scenario", () => {
    const block = {
      type: "scenario" as const,
      id: "sc1",
      blocks: [{ type: "text" as const, id: "n", text: "nested" }],
    };
    const { project } = applyCommand(sampleProject, {
      type: "insertBlock",
      pageId: "lesson-1",
      parentPath: [],
      index: 0,
      block,
    });
    const inserted = project.pages[0]!.blocks[0];
    expect(inserted?.type).toBe("scenario");
  });

  it("clones nested blocks when inserting container", () => {
    const block = {
      type: "container" as const,
      id: "c-new",
      blocks: [{ type: "text" as const, id: "nested", text: "child" }],
    };
    const { project } = applyCommand(sampleProject, {
      type: "insertBlock",
      pageId: "lesson-1",
      parentPath: [],
      index: 0,
      block,
    });
    const inserted = project.pages[0]!.blocks[0];
    expect(inserted?.type).toBe("container");
    if (inserted?.type === "container") {
      expect(inserted.blocks[0]?.id).toBe("nested");
      expect(inserted.blocks[0]).not.toBe(block.blocks[0]);
    }
  });

  it("updateBlockProps no-op when block missing", () => {
    const { project } = applyCommand(sampleProject, {
      type: "updateBlockProps",
      pageId: "lesson-1",
      blockId: "nope",
      props: { text: "x" },
    });
    expect(project).toEqual(sampleProject);
  });

  it("resolveSelectionAfterCommand updateBlockProps uses findBlockRef path", () => {
    expect(
      resolveSelectionAfterCommand(
        sampleProject,
        { type: "updateBlockProps", pageId: "lesson-1", blockId: "h1", props: { text: "X" } },
        { kind: "page", pageId: "lesson-1" },
      ),
    ).toEqual({ kind: "block", pageId: "lesson-1", blockId: "h1", parentPath: [] });

    expect(
      resolveSelectionAfterCommand(
        sampleProject,
        { type: "updateBlockProps", pageId: "lesson-1", blockId: "missing", props: {} },
        { kind: "page", pageId: "lesson-1" },
      ),
    ).toEqual({ kind: "block", pageId: "lesson-1", blockId: "missing", parentPath: [] });
  });

  it("resolveSelectionAfterCommand branches", () => {
    const project = sampleProject;
    expect(
      resolveSelectionAfterCommand(
        project,
        { type: "setSelection", selection: { kind: "none" } },
        { kind: "block", pageId: "lesson-1", blockId: "h1", parentPath: [] },
      ),
    ).toEqual({ kind: "none" });

    expect(
      resolveSelectionAfterCommand(
        project,
        { type: "moveBlock", pageId: "lesson-1", blockId: "h1", toParentPath: [], toIndex: 1 },
        { kind: "block", pageId: "lesson-1", blockId: "h1", parentPath: [] },
      ).kind,
    ).toBe("block");

    const deleted = resolveSelectionAfterCommand(
      project,
      { type: "deleteBlock", pageId: "lesson-1", blockId: "h1" },
      { kind: "block", pageId: "lesson-1", blockId: "h1", parentPath: [] },
    );
    expect(deleted).toEqual({ kind: "page", pageId: "lesson-1" });
  });

  it("resolveSelectionAfterCommand addPage falls back when pages are empty", () => {
    expect(
      resolveSelectionAfterCommand(
        { ...sampleProject, pages: [] },
        { type: "addPage", title: "Orphan" },
        { kind: "page", pageId: "lesson-1" },
      ),
    ).toEqual({ kind: "page", pageId: "lesson-1" });
  });

  it("resolveSelectionAfterCommand deletePage with empty project returns none", () => {
    expect(
      resolveSelectionAfterCommand(
        { ...sampleProject, pages: [] },
        { type: "deletePage", pageId: "lesson-1" },
        { kind: "page", pageId: "lesson-1" },
      ),
    ).toEqual({ kind: "none" });
  });

  it("resolveActivePageAfterCommand when page removed", () => {
    const onePage = { ...sampleProject, pages: [sampleProject.pages[0]!] };
    expect(
      resolveActivePageAfterCommand(onePage, { type: "deletePage", pageId: "lesson-1" }, "lesson-1"),
    ).toBe("lesson-1");
    expect(
      resolveActivePageAfterCommand(sampleProject, { type: "addPage", title: "New" }, "lesson-1"),
    ).toBe(sampleProject.pages[sampleProject.pages.length - 1]?.id);
    expect(
      resolveActivePageAfterCommand(
        sampleProject,
        { type: "setActivePage", pageId: "lesson-2" },
        "lesson-1",
      ),
    ).toBe("lesson-2");
    expect(
      resolveActivePageAfterCommand(sampleProject, { type: "renamePage", pageId: "lesson-1", title: "X" }, "gone"),
    ).toBe("lesson-1");
    expect(
      resolveActivePageAfterCommand(
        { ...sampleProject, pages: [] },
        { type: "deletePage", pageId: "lesson-1" },
        "lesson-1",
      ),
    ).toBe("lesson-1");
    expect(
      resolveActivePageAfterCommand({ ...sampleProject, pages: [] }, { type: "addPage", title: "Solo" }, "gone"),
    ).toBe("gone");
    expect(
      resolveActivePageAfterCommand({ ...sampleProject, pages: [] }, { type: "renamePage", pageId: "x", title: "Y" }, "gone"),
    ).toBe("gone");
  });

  it("resolveSelection covers deletePage and setActivePage", () => {
    expect(
      resolveSelectionAfterCommand(
        sampleProject,
        { type: "setActivePage", pageId: "lesson-2" },
        { kind: "page", pageId: "lesson-1" },
      ),
    ).toEqual({ kind: "page", pageId: "lesson-2" });

    expect(
      resolveSelectionAfterCommand(
        sampleProject,
        { type: "deletePage", pageId: "lesson-2" },
        { kind: "page", pageId: "lesson-2" },
      ),
    ).toEqual({ kind: "page", pageId: "lesson-1" });

    expect(
      resolveSelectionAfterCommand(
        sampleProject,
        { type: "deletePage", pageId: "lesson-2" },
        { kind: "block", pageId: "lesson-2", blockId: "c1", parentPath: [] },
      ),
    ).toEqual({ kind: "page", pageId: "lesson-1" });

    expect(
      resolveSelectionAfterCommand(
        sampleProject,
        { type: "deleteBlock", pageId: "lesson-1", blockId: "other" },
        { kind: "page", pageId: "lesson-1" },
      ),
    ).toEqual({ kind: "page", pageId: "lesson-1" });

    expect(
      resolveSelectionAfterCommand(
        sampleProject,
        { type: "deletePage", pageId: "lesson-2" },
        { kind: "page", pageId: "lesson-1" },
      ),
    ).toEqual({ kind: "page", pageId: "lesson-1" });
  });
});

describe("tree edge cases", () => {
  it("findBlockRef returns null for missing page", () => {
    expect(findBlockRef(sampleProject, "missing-page", "h1")).toBeNull();
  });
  it("returns null for invalid paths", () => {
    expect(getBlocksAtPath(sampleProject, "lesson-1", [99])).toBeNull();
    expect(getBlocksAtPath(sampleProject, "missing", [])).toBeNull();
    expect(getBlocksAtPath(sampleProject, "lesson-1", [0])).toBeNull();
    const deepPath = Array.from({ length: 20 }, (_, i) => i);
    expect(getBlocksAtPath(sampleProject, "lesson-1", deepPath)).toBeNull();
  });

  it("setBlocksAtPath and removeBlock", () => {
    const next = setBlocksAtPath(sampleProject, "lesson-1", [], [
      { type: "text", id: "only", text: "x" },
    ]);
    expect(next.pages[0]!.blocks).toHaveLength(1);
    expect(removeBlockFromProject(next, "lesson-1", "only")?.pages[0]!.blocks).toHaveLength(0);
    expect(removeBlockFromProject(sampleProject, "lesson-1", "missing")).toBeNull();
    expect(removeBlockFromProject(deepNestedProject(9), "lesson-1", "deep-text")).toBeNull();

    const nested = setBlocksAtPath(sampleProject, "lesson-2", [0], [
      { type: "text", id: "inner", text: "nested" },
    ]);
    expect(nested.pages[1]!.blocks[0]).toMatchObject({ type: "container" });
    const inner = getBlocksAtPath(nested, "lesson-2", [0]);
    expect(inner?.[0]?.id).toBe("inner");
  });

  it("clones sibling blocks when updating nested container path", () => {
    const withSiblings = {
      ...sampleProject,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            { type: "text" as const, id: "t1", text: "a" },
            {
              type: "container" as const,
              id: "c1",
              blocks: [{ type: "text" as const, id: "inner", text: "x" }],
            },
            { type: "text" as const, id: "t2", text: "b" },
          ],
        },
      ],
    };
    const next = setBlocksAtPath(withSiblings, "lesson-1", [1], [
      { type: "text", id: "replaced", text: "r" },
    ]);
    expect(next.pages[0]!.blocks[0]?.id).toBe("t1");
    expect(next.pages[0]!.blocks[2]?.id).toBe("t2");
    expect(getBlocksAtPath(next, "lesson-1", [1])?.[0]?.id).toBe("replaced");
  });

  it("updates deeply nested container blocks", () => {
    const deep = {
      ...sampleProject,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            {
              type: "container" as const,
              id: "c1",
              blocks: [
                {
                  type: "container" as const,
                  id: "c2",
                  blocks: [{ type: "text" as const, id: "deep", text: "d" }],
                },
              ],
            },
          ],
        },
      ],
    };
    const next = setBlocksAtPath(deep, "lesson-1", [0, 0], [
      { type: "text", id: "replaced", text: "r" },
    ]);
    const inner = getBlocksAtPath(next, "lesson-1", [0, 0]);
    expect(inner?.[0]?.id).toBe("replaced");
  });

  it("handles invalid nested parent in setBlocksAtPathOnPage", () => {
    const badPage = {
      id: "lesson-1",
      title: "L",
      blocks: [{ type: "text" as const, id: "t", text: "x" }],
    };
    const project = { ...sampleProject, pages: [badPage] };
    const next = setBlocksAtPath(project, "lesson-1", [0], []);
    expect(next.pages[0]!.blocks[0]?.type).toBe("text");
  });

  it("collectBlockIds and helpers", () => {
    expect(collectBlockIds(sampleProject).has("h1")).toBe(true);
    expect(parentPathDepth([0, 1])).toBe(2);
    expect(isNestableParent({ type: "container", id: "c", blocks: [] })).toBe(true);
    expect(isNestableParent({ type: "text", id: "t", text: "" })).toBe(false);
  });
});

describe("autosave", () => {
  it("uses default debounce when options omit debounceMs", () => {
    vi.useFakeTimers();
    const listeners = new Set<() => void>();
    const subscribe = (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    const onSave = vi.fn();
    let project = sampleProject;
    subscribeAutosave(
      subscribe,
      () => project,
      () => true,
      onSave,
    );
    project = { ...project, course: { ...project.course, title: "Changed" } };
    listeners.forEach((l) => l());
    vi.advanceTimersByTime(500);
    expect(onSave).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("debounces and skips when not dirty or unchanged", () => {
    vi.useFakeTimers();
    const listeners = new Set<() => void>();
    const subscribe = (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    const notify = () => listeners.forEach((l) => l());

    const onSave = vi.fn();
    let dirty = false;
    let project = sampleProject;
    const unsub = subscribeAutosave(
      subscribe,
      () => project,
      () => dirty,
      onSave,
      { debounceMs: 10 },
    );

    dirty = true;
    project = { ...project, course: { ...project.course, title: "Changed once" } };
    notify();
    vi.advanceTimersByTime(15);
    expect(onSave).toHaveBeenCalledTimes(1);

    dirty = true;
    notify();
    vi.advanceTimersByTime(15);
    expect(onSave).toHaveBeenCalledTimes(1);

    dirty = false;
    notify();
    vi.advanceTimersByTime(15);
    expect(onSave).toHaveBeenCalledTimes(1);

    dirty = true;
    project = { ...project, course: { ...project.course, title: "Changed twice" } };
    notify();
    vi.advanceTimersByTime(15);
    expect(onSave).toHaveBeenCalledTimes(2);

    unsub();
    vi.advanceTimersByTime(50);
    vi.useRealTimers();
  });

  it("unsubscribe clears pending timer", () => {
    vi.useFakeTimers();
    const listeners = new Set<() => void>();
    const subscribe = (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    const unsub = subscribeAutosave(
      subscribe,
      () => sampleProject,
      () => true,
      () => {},
      { debounceMs: 100 },
    );
    listeners.forEach((l) => l());
    unsub();
    vi.advanceTimersByTime(200);
    vi.useRealTimers();
  });

  it("reschedules when notify fires again before debounce", () => {
    vi.useFakeTimers();
    const listeners = new Set<() => void>();
    const subscribe = (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    let project = sampleProject;
    subscribeAutosave(
      subscribe,
      () => project,
      () => true,
      () => {},
      { debounceMs: 50 },
    );
    listeners.forEach((l) => l());
    vi.advanceTimersByTime(10);
    project = { ...project, course: { ...project.course, title: "Reschedule" } };
    listeners.forEach((l) => l());
    vi.advanceTimersByTime(60);
    vi.useRealTimers();
  });
});

describe("createDefaultBlock", () => {
  it("throws for unknown block types", () => {
    expect(() => createDefaultBlock("not-in-catalog")).toThrow(/Unknown studio block type/);
  });
});

describe("store edge cases", () => {
  it("undo/redo when empty does nothing", () => {
    const store = createEditorStore(sampleProject);
    store.getState().undo();
    store.getState().redo();
    expect(store.getState().canUndo).toBe(false);
  });

  it("handles empty project pages for active id", () => {
    const empty = {
      ...sampleProject,
      pages: [{ id: "only", title: "Only", blocks: [] }],
    };
    const store = createEditorStore(empty);
    expect(store.getState().activePageId).toBe("only");
  });

  it("handles project with no pages for active id", () => {
    const store = createEditorStore({ ...sampleProject, pages: [] });
    expect(store.getState().activePageId).toBe("");
  });

  it("trims undo history after MAX_HISTORY entries", () => {
    const store = createEditorStore(sampleProject);
    for (let i = 0; i < 101; i += 1) {
      store.getState().dispatch({
        type: "updateBlockProps",
        pageId: "lesson-1",
        blockId: "h1",
        props: { text: `Edit ${i}` },
      });
    }
    expect(store.getState().canUndo).toBe(true);
    for (let i = 0; i < 100; i += 1) {
      store.getState().undo();
    }
    expect(store.getState().canUndo).toBe(false);
    expect(store.getState().project.pages[0]!.blocks[0]).toMatchObject({
      type: "heading",
      text: "Edit 0",
    });
  });
});
