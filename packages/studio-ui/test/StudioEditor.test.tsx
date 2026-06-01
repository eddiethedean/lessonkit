import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { StudioProjectV1 } from "@lessonkit/studio-schema";
import { StudioEditor } from "../src/StudioEditor";

const project: StudioProjectV1 = {
  schemaVersion: 1,
  course: { courseId: "editor-test", title: "Editor test" },
  pages: [
    {
      id: "lesson-1",
      title: "Lesson one",
      blocks: [{ type: "text", id: "text-1", text: "Hello editor" }],
    },
  ],
};

describe("StudioEditor", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders canvas and preview", () => {
    const onChange = vi.fn();
    render(<StudioEditor project={project} onProjectChange={onChange} />);
    const canvas = screen.getByTestId("studio-canvas");
    expect(screen.getByTestId("studio-preview")).toBeDefined();
    expect(within(canvas).getByText("Hello editor")).toBeDefined();
  });

  it("adds a block from the palette", () => {
    const onChange = vi.fn();
    render(<StudioEditor project={project} onProjectChange={onChange} />);
    fireEvent.click(screen.getAllByRole("button", { name: "heading" })[0]!);
    expect(screen.getAllByText(/New heading/i).length).toBeGreaterThan(0);
  });

  it("undo restores prior project", async () => {
    const onChange = vi.fn();
    const { container } = render(<StudioEditor project={project} onProjectChange={onChange} />);
    const canvas = screen.getAllByTestId("studio-canvas")[0]!;
    fireEvent.click(screen.getAllByRole("button", { name: "heading" })[0]!);
    await waitFor(() => {
      expect(within(canvas).getAllByText(/New heading/i).length).toBeGreaterThan(0);
    });
    const toolbar = container.querySelector(".lk-studio-toolbar") as HTMLElement;
    fireEvent.click(within(toolbar).getByRole("button", { name: "Undo" }));
    await waitFor(() => {
      expect(within(canvas).queryAllByText(/New heading/i).length).toBe(0);
    });
  });

  it("edits block and page properties", () => {
    const onChange = vi.fn();
    render(<StudioEditor project={project} onProjectChange={onChange} />);
    const canvas = screen.getAllByTestId("studio-canvas")[0]!;
    fireEvent.click(within(canvas).getByText("Hello editor"));
    const textInput = screen.getByDisplayValue("Hello editor");
    fireEvent.change(textInput, { target: { value: "Updated copy" } });
    expect(screen.getAllByText("Updated copy").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Lesson one" }));
    const titleInput = screen.getByDisplayValue("Lesson one");
    fireEvent.change(titleInput, { target: { value: "Renamed lesson" } });
    expect(screen.getByRole("button", { name: "Renamed lesson" })).toBeDefined();
  });

  it("adds a page from the page list", () => {
    const onChange = vi.fn();
    render(<StudioEditor project={project} onProjectChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Add page" }));
    expect(screen.getAllByRole("button", { name: /New page|page/i }).length).toBeGreaterThan(1);
  });

  it("supports keyboard undo and redo", () => {
    const onChange = vi.fn();
    render(<StudioEditor project={project} onProjectChange={onChange} />);
    fireEvent.click(screen.getAllByRole("button", { name: "heading" })[0]!);
    fireEvent.keyDown(window, { key: "z", metaKey: true });
    fireEvent.keyDown(window, { key: "z", metaKey: true, shiftKey: true });
  });

  it("deletes a selected block from the inspector", async () => {
    const onChange = vi.fn();
    render(<StudioEditor project={project} onProjectChange={onChange} />);
    const canvas = screen.getAllByTestId("studio-canvas")[0]!;
    fireEvent.click(within(canvas).getByText("Hello editor"));
    fireEvent.click(screen.getByRole("button", { name: "Delete block" }));
    await waitFor(() => {
      expect(within(canvas).queryByText("Hello editor")).toBeNull();
    });
  });

  it("selects the page when clicking the canvas background", () => {
    const onChange = vi.fn();
    render(<StudioEditor project={project} onProjectChange={onChange} />);
    const canvas = screen.getAllByTestId("studio-canvas")[0]!;
    fireEvent.click(canvas);
    expect(screen.getByDisplayValue("Lesson one")).toBeDefined();
  });

  it("inserts from palette via keyboard on wrapper", () => {
    const onChange = vi.fn();
    render(<StudioEditor project={project} onProjectChange={onChange} />);
    const wrappers = screen.getAllByRole("presentation");
    const textWrapper = wrappers.find((el) => el.textContent?.includes("text"));
    expect(textWrapper).toBeTruthy();
    fireEvent.keyDown(textWrapper!, { key: "Enter" });
    expect(screen.getAllByText("New text").length).toBeGreaterThan(0);
  });
});

