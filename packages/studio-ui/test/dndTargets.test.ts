import { describe, expect, it, vi } from "vitest";
import { createEditorStore } from "@lessonkit/studio-builder";
import type { StudioProjectV1 } from "@lessonkit/studio-schema";
import {
  applyDragEnd,
  createEditorDndHandlers,
  dropZoneId,
  parseDropZoneId,
  resolveInsertTarget,
} from "../src/dndTargets";
import { dragEndEventStub, dragEndStub } from "./dndTestUtils";

const project: StudioProjectV1 = {
  schemaVersion: 1,
  course: { courseId: "dnd-test", title: "DnD test" },
  pages: [
    {
      id: "lesson-1",
      title: "Lesson",
      blocks: [
        { type: "text", id: "text-1", text: "Hello" },
        { type: "container", id: "box-1", blocks: [] },
      ],
    },
  ],
};

describe("dndTargets", () => {
  it("dropZoneId and parseDropZoneId round-trip", () => {
    expect(parseDropZoneId(dropZoneId("lesson-1", []))).toEqual({
      pageId: "lesson-1",
      parentPath: [],
    });
    expect(parseDropZoneId(dropZoneId("lesson-1", [1]))).toEqual({
      pageId: "lesson-1",
      parentPath: [1],
    });
    expect(parseDropZoneId("invalid")).toBeNull();
    expect(parseDropZoneId("drop__lesson-1__not-a-number")).toBeNull();
  });

  it("resolveInsertTarget handles drop zones and nestable blocks", () => {
    expect(resolveInsertTarget(dropZoneId("lesson-1", []), project, "lesson-1", true)).toEqual({
      parentPath: [],
      index: 2,
    });
    expect(resolveInsertTarget(dropZoneId("lesson-1", [99]), project, "lesson-1", true)).toEqual({
      parentPath: [99],
      index: 0,
    });
    expect(resolveInsertTarget(dropZoneId("lesson-2", []), project, "lesson-1", true)).toBeNull();
    expect(resolveInsertTarget("box-1", project, "lesson-1", true)).toEqual({
      parentPath: [1],
      index: 0,
    });
    expect(resolveInsertTarget("text-1", project, "lesson-1", false)).toEqual({
      parentPath: [],
      index: 0,
    });
    expect(resolveInsertTarget("missing", project, "lesson-1", false)).toBeNull();
  });

  it("resolveInsertTarget nests into scenario blocks from palette", () => {
    const withScenario: StudioProjectV1 = {
      ...project,
      pages: [
        {
          id: "lesson-1",
          title: "Lesson",
          blocks: [{ type: "scenario", id: "sc-1", blocks: [{ type: "text", id: "inner", text: "x" }] }],
        },
      ],
    };
    expect(resolveInsertTarget("sc-1", withScenario, "lesson-1", true)).toEqual({
      parentPath: [0],
      index: 1,
    });
  });

  it("applyDragEnd inserts from palette and moves on canvas", () => {
    const store = createEditorStore(project);
    const dispatch = vi.spyOn(store.getState(), "dispatch");

    applyDragEnd(
      dragEndStub(
        { id: "palette:heading", data: { current: { source: "palette", blockType: "heading" } } },
        { id: dropZoneId("lesson-1", []) },
      ),
      {
        activePageId: "lesson-1",
        project: store.getState().project,
        collectBlockIds: () => store.getState().collectBlockIds(),
        dispatch: (cmd) => store.getState().dispatch(cmd),
      },
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "insertBlock", pageId: "lesson-1" }),
    );

    dispatch.mockClear();
    const withHeading = store.getState().project;

    applyDragEnd(
      dragEndStub(
        {
          id: "text-1",
          data: { current: { source: "canvas", blockId: "text-1", pageId: "lesson-1" } },
        },
        { id: "box-1" },
      ),
      {
        activePageId: "lesson-1",
        project: withHeading,
        collectBlockIds: () => store.getState().collectBlockIds(),
        dispatch: (cmd) => store.getState().dispatch(cmd),
      },
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "moveBlock", blockId: "text-1" }),
    );
  });

  it("applyDragEnd skips canvas move when target is missing", () => {
    const store = createEditorStore(project);
    const dispatch = vi.spyOn(store.getState(), "dispatch");
    applyDragEnd(
      dragEndStub(
        {
          id: "text-1",
          data: { current: { source: "canvas", blockId: "text-1", pageId: "lesson-1" } },
        },
        { id: "missing-target" },
      ),
      {
        activePageId: "lesson-1",
        project: store.getState().project,
        collectBlockIds: () => store.getState().collectBlockIds(),
        dispatch: (cmd) => store.getState().dispatch(cmd),
      },
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("applyDragEnd skips move when active and over are the same", () => {
    const store = createEditorStore(project);
    const dispatch = vi.spyOn(store.getState(), "dispatch");
    applyDragEnd(
      dragEndStub(
        {
          id: "text-1",
          data: { current: { source: "canvas", blockId: "text-1", pageId: "lesson-1" } },
        },
        { id: "text-1" },
      ),
      {
        activePageId: "lesson-1",
        project: store.getState().project,
        collectBlockIds: () => store.getState().collectBlockIds(),
        dispatch: (cmd) => store.getState().dispatch(cmd),
      },
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("applyDragEnd no-ops when insert target is missing", () => {
    const store = createEditorStore(project);
    const dispatch = vi.spyOn(store.getState(), "dispatch");
    applyDragEnd(
      dragEndStub(
        { id: "palette:text", data: { current: { source: "palette", blockType: "text" } } },
        { id: "missing-target" },
      ),
      {
        activePageId: "lesson-1",
        project: store.getState().project,
        collectBlockIds: () => store.getState().collectBlockIds(),
        dispatch: (cmd) => store.getState().dispatch(cmd),
      },
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("applyDragEnd no-ops without over or page", () => {
    const store = createEditorStore(project);
    const dispatch = vi.spyOn(store.getState(), "dispatch");

    applyDragEnd(dragEndStub({ id: "x" }, null), {
      activePageId: "lesson-1",
      project: store.getState().project,
      collectBlockIds: () => store.getState().collectBlockIds(),
      dispatch: (cmd) => store.getState().dispatch(cmd),
    });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("createEditorDndHandlers clears active drag on end", () => {
    const store = createEditorStore(project);
    const handlers = createEditorDndHandlers(store, "lesson-1");
    let drag: string | null = "x";
    handlers.onDragEnd(
      dragEndEventStub(
        { id: "palette:text", data: { current: { source: "palette", blockType: "text" } } },
        { id: "text-1" },
      ),
      (id) => {
        drag = id;
      },
    );
    expect(drag).toBeNull();
  });
});
