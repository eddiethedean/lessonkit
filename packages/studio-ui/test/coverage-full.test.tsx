import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import type { StudioBlock, StudioProjectV1 } from "@lessonkit/studio-schema";
import { createEditorStore } from "@lessonkit/studio-builder";
import { StudioEditor } from "../src/StudioEditor";
import { DragOverlayContent } from "../src/DragOverlayContent";
import { PropertyInspector } from "../src/PropertyInspector";
import { PageList } from "../src/PageList";
import { BlockPalette } from "../src/BlockPalette";
import { EditorCanvas } from "../src/EditorCanvas";
import { useEditorStore } from "../src/useEditorStore";
import {
  applyDragEnd,
  createEditorDndHandlers,
  parseDropZoneId,
  resolveInsertTarget,
} from "../src/dndTargets";
import { dragEndEventStub, dragEndStub, dragStartStub } from "./dndTestUtils";

const baseProject: StudioProjectV1 = {
  schemaVersion: 1,
  course: { courseId: "cov-ui", title: "Coverage UI" },
  pages: [
    {
      id: "lesson-1",
      title: "Lesson one",
      blocks: [
        { type: "heading", id: "h1", level: 2, text: "Title" },
        { type: "text", id: "text-1", text: "Body" },
        { type: "checklist", id: "cl-1", items: ["One", "Two"] },
        { type: "container", id: "box-1", blocks: [] },
      ],
    },
    { id: "lesson-2", title: "Lesson two", blocks: [] },
  ],
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("studio-ui coverage", () => {
  it("DragOverlayContent shows overlay when dragging", () => {
    const { container: empty } = render(<DragOverlayContent activeDrag={null} />);
    expect(empty.firstChild).toBeNull();
    render(<DragOverlayContent activeDrag="palette:text" />);
    expect(document.querySelector(".lk-studio-block-wrap--selected")).toBeTruthy();
  });

  it("createEditorDndHandlers wires drag start and end", () => {
    const store = createEditorStore(baseProject);
    const handlers = createEditorDndHandlers(store, "lesson-1");
    expect(handlers.onDragStart(dragStartStub({ id: "palette:text" }))).toBe("palette:text");
    let drag: string | null = "palette:text";
    const dispatch = vi.spyOn(store.getState(), "dispatch");
    handlers.onDragEnd(
      dragEndEventStub(
        { id: "palette:image", data: { current: { source: "palette", blockType: "image" } } },
        { id: "text-1" },
      ),
      (id) => {
        drag = id;
      },
    );
    expect(drag).toBeNull();
    expect(dispatch).toHaveBeenCalled();
  });

  it("dndTargets edge branches", () => {
    expect(parseDropZoneId("drop__only")).toBeNull();
    expect(resolveInsertTarget("drop__lesson-2__root", baseProject, "lesson-1", true)).toBeNull();

    const store = createEditorStore(baseProject);
    const dispatch = vi.spyOn(store.getState(), "dispatch");
    applyDragEnd(
      dragEndStub({ id: "text-1", data: { current: { source: "canvas" } } }, { id: "text-1" }),
      {
        activePageId: "lesson-1",
        project: store.getState().project,
        collectBlockIds: () => store.getState().collectBlockIds(),
        dispatch: (cmd) => store.getState().dispatch(cmd),
      },
    );
    expect(dispatch).not.toHaveBeenCalled();

    applyDragEnd(
      dragEndStub(
        { id: "x", data: { current: { source: "palette", blockType: "text" } } },
        { id: "y" },
      ),
      {
        activePageId: "missing",
        project: store.getState().project,
        collectBlockIds: () => store.getState().collectBlockIds(),
        dispatch: (cmd) => store.getState().dispatch(cmd),
      },
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("useEditorStore server snapshot", () => {
    const store = createEditorStore(baseProject);
    function Probe({ s }: { s: typeof store }) {
      const title = useEditorStore(s, (state) => state.project.course.title);
      return <span>{title}</span>;
    }
    const html = renderToString(<Probe s={store} />);
    expect(html).toContain("Coverage UI");
  });

  it("PropertyInspector covers quiz, checklist, heading, and empty states", () => {
    const store = createEditorStore(baseProject);
    store.getState().dispatch({ type: "setSelection", selection: { kind: "none" } });
    const { unmount: unmountEmpty } = render(<PropertyInspector store={store} />);
    expect(screen.getByText(/Select a block or page/i)).toBeDefined();
    unmountEmpty();

    store.getState().dispatch({
      type: "setSelection",
      selection: { kind: "page", pageId: "lesson-1" },
    });
    const { unmount: unmountPage } = render(<PropertyInspector store={store} />);
    expect(screen.getByText(/^Page$/)).toBeDefined();
    unmountPage();

    const quizStore = createEditorStore({
      ...baseProject,
      pages: [
        {
          id: "lesson-1",
          title: "Lesson one",
          blocks: [
            {
              type: "quiz",
              id: "quiz-1",
              checkId: "check-1",
              question: "Q?",
              choices: ["A", "B"],
              answer: "A",
            },
          ],
        },
      ],
    });
    quizStore.getState().dispatch({
      type: "setSelection",
      selection: { kind: "block", pageId: "lesson-1", blockId: "quiz-1", parentPath: [] },
    });
    const { unmount: unmountQuiz } = render(<PropertyInspector store={quizStore} />);
    const choices = screen.getByLabelText(/choices/i);
    fireEvent.change(choices, { target: { value: "X, Y" } });
    unmountQuiz();

    store.getState().dispatch({
      type: "setSelection",
      selection: { kind: "block", pageId: "lesson-1", blockId: "cl-1", parentPath: [] },
    });
    const { unmount: unmountChecklist } = render(<PropertyInspector store={store} />);
    fireEvent.change(screen.getByLabelText(/items/i), { target: { value: "A\nB" } });
    unmountChecklist();

    store.getState().dispatch({
      type: "setSelection",
      selection: { kind: "block", pageId: "lesson-1", blockId: "h1", parentPath: [] },
    });
    const { unmount: unmountHeading } = render(<PropertyInspector store={store} />);
    fireEvent.change(screen.getByLabelText("level"), { target: { value: "3" } });
    unmountHeading();

    store.getState().dispatch({
      type: "setSelection",
      selection: { kind: "block", pageId: "lesson-1", blockId: "box-1", parentPath: [] },
    });
    const { unmount: unmountContainer } = render(<PropertyInspector store={store} />);
    expect(screen.getByRole("button", { name: "Delete block" })).toBeDefined();
    unmountContainer();

    store.getState().dispatch({
      type: "setSelection",
      selection: { kind: "page", pageId: "missing-page" },
    });
    const { unmount: unmountMissingPage } = render(<PropertyInspector store={store} />);
    expect(screen.getByText(/Select a block or page/i)).toBeDefined();
    unmountMissingPage();

    const videoStore = createEditorStore({
      ...baseProject,
      pages: [
        {
          id: "lesson-1",
          title: "Lesson one",
          blocks: [{ type: "video", id: "vid-1", src: "https://example.com/v.mp4" }],
        },
      ],
    });
    videoStore.getState().dispatch({
      type: "setSelection",
      selection: { kind: "block", pageId: "lesson-1", blockId: "vid-1", parentPath: [] },
    });
    const { unmount: unmountVideo } = render(<PropertyInspector store={videoStore} />);
    const titleInput = screen.getByLabelText("title");
    expect((titleInput as HTMLInputElement).value).toBe("");
    fireEvent.change(titleInput, { target: { value: "Clip" } });
    unmountVideo();

    const imageStore = createEditorStore({
      ...baseProject,
      pages: [
        {
          id: "lesson-1",
          title: "Lesson one",
          blocks: [{ type: "image", id: "img-1", src: "https://example.com/x.png", alt: "" }],
        },
      ],
    });
    imageStore.getState().dispatch({
      type: "setSelection",
      selection: { kind: "block", pageId: "lesson-1", blockId: "img-1", parentPath: [] },
    });
    const { unmount: unmountImage } = render(<PropertyInspector store={imageStore} />);
    fireEvent.change(screen.getByLabelText("alt"), { target: { value: "Alt text" } });
    unmountImage();

    const badQuizStore = createEditorStore({
      ...baseProject,
      pages: [
        {
          id: "lesson-1",
          title: "Lesson one",
          blocks: [
            {
              type: "quiz",
              id: "quiz-bad",
              checkId: "check-bad",
              question: "Q?",
              choices: ["A", "B"],
              answer: "A",
            },
          ],
        },
      ],
    });
    const badProject = badQuizStore.getState().project;
    const badPage = badProject.pages[0]!;
    badPage.blocks[0] = {
      type: "quiz",
      id: "quiz-bad",
      checkId: "check-bad",
      question: "Q?",
      choices: "not-array",
      answer: "A",
    } as unknown as StudioBlock;
    badQuizStore.setState({ project: { ...badProject, pages: [badPage] } });
    badQuizStore.getState().dispatch({
      type: "setSelection",
      selection: { kind: "block", pageId: "lesson-1", blockId: "quiz-bad", parentPath: [] },
    });
    render(<PropertyInspector store={badQuizStore} />);
    expect((screen.getByLabelText(/choices/i) as HTMLInputElement).value).toBe("");

    store.getState().dispatch({
      type: "setSelection",
      selection: { kind: "block", pageId: "lesson-1", blockId: "missing", parentPath: [] },
    });
    render(<PropertyInspector store={store} />);
    expect(screen.getByText(/Select a block or page/i)).toBeDefined();
  });

  it("PageList switches active page", () => {
    const store = createEditorStore(baseProject);
    render(<PageList store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Lesson two" }));
    expect(store.getState().activePageId).toBe("lesson-2");
  });

  it("EditorCanvas handles missing page and keyboard select", () => {
    const store = createEditorStore(baseProject);
    store.setState({ activePageId: "missing-page" });
    const { unmount: unmountMissing } = render(<EditorCanvas store={store} />);
    expect(screen.getByText(/No active page/i)).toBeDefined();
    unmountMissing();

    store.setState({ activePageId: "lesson-1" });
    render(<EditorCanvas store={store} />);
    const canvas = screen.getAllByTestId("studio-canvas")[0]!;
    const block = within(canvas).getByText("Body").closest('[role="button"]') as HTMLElement;
    fireEvent.keyDown(block, { key: "Enter" });
    expect(store.getState().selection.kind).toBe("block");

    fireEvent.click(within(canvas).getByText("Title"));
    const containerWrap = within(canvas).getByText("Title").closest(".lk-studio-block-wrap");
    expect(containerWrap).toBeTruthy();
  });

  it("BlockPalette inserts via click wrapper", () => {
    const store = createEditorStore({
      ...baseProject,
      pages: [{ id: "lesson-1", title: "L", blocks: [] }],
    });
    render(<BlockPalette store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "text" }));
    expect(store.getState().project.pages[0]!.blocks.length).toBeGreaterThan(0);
  });

  it("StudioEditor validation banner, redo, className, and external store", () => {
    const store = createEditorStore(baseProject);
    store.setState({
      validationIssues: [{ path: "pages[0].id", message: "Invalid id" }],
    });
    render(
      <StudioEditor
        project={baseProject}
        store={store}
        className="custom-editor"
        onProjectChange={() => {}}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Invalid id");
    expect(document.querySelector(".lk-studio-editor.custom-editor")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "heading" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    const redo = screen.getByRole("button", { name: "Redo" });
    expect((redo as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(redo);

    const external = createEditorStore(baseProject);
    external.getState().dispatch({
      type: "insertBlock",
      pageId: "lesson-1",
      parentPath: [],
      index: 0,
      block: { type: "text", id: "ext-1", text: "External" },
    });
    const { rerender } = render(
      <StudioEditor project={baseProject} store={external} onProjectChange={() => {}} />,
    );
    rerender(<StudioEditor project={baseProject} store={external} onProjectChange={() => {}} />);
    expect(external.getState().project.pages[0]!.blocks.some((b) => b.id === "ext-1")).toBe(true);
  });
});
