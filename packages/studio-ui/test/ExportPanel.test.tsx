import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { StudioProjectV1 } from "@lessonkit/studio-schema";
import { ExportPanel } from "../src/ExportPanel";

const project: StudioProjectV1 = {
  schemaVersion: 1,
  course: { courseId: "export-ui", title: "Export UI" },
  pages: [
    {
      id: "lesson-1",
      title: "Lesson",
      blocks: [{ type: "text", id: "t1", text: "Hello" }],
    },
  ],
};

describe("ExportPanel", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("calls onDownloadZip with generated files", async () => {
    const onDownloadZip = vi.fn().mockResolvedValue(undefined);
    render(<ExportPanel project={project} onDownloadZip={onDownloadZip} />);
    fireEvent.click(screen.getByRole("button", { name: /Download React\/Vite zip/i }));
    await vi.waitFor(() => expect(onDownloadZip).toHaveBeenCalledOnce());
    const [files, slug] = onDownloadZip.mock.calls[0]!;
    expect(slug).toBe("export-ui");
    expect(files.some((f: { path: string }) => f.path === "src/main.tsx")).toBe(true);
  });

  it("generates jsx export when mode is switched", async () => {
    const onDownloadZip = vi.fn().mockResolvedValue(undefined);
    render(<ExportPanel project={project} onDownloadZip={onDownloadZip} className="custom" />);
    const [modeSelect, themeSelect] = screen.getAllByRole("combobox");
    fireEvent.change(modeSelect!, { target: { value: "jsx" } });
    fireEvent.change(themeSelect!, { target: { value: "brand" } });
    fireEvent.change(screen.getByPlaceholderText(/lessonkit.app\/courses/i), {
      target: { value: "https://example.com/course" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Download React\/Vite zip/i }));
    await vi.waitFor(() => expect(onDownloadZip).toHaveBeenCalledOnce());
    const [files] = onDownloadZip.mock.calls[0]!;
    expect(files.some((f: { path: string }) => f.path === "src/App.tsx")).toBe(true);
    expect(document.querySelector(".lk-studio-export.custom")).toBeTruthy();
  });

  it("shows validation errors for empty pages", () => {
    render(
      <ExportPanel
        project={{ ...project, pages: [] }}
        onDownloadZip={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert").textContent).toMatch(/at least one page/i);
  });

  it("reports missing zip handler", async () => {
    render(<ExportPanel project={project} />);
    fireEvent.click(screen.getByRole("button", { name: /Download React\/Vite zip/i }));
    await vi.waitFor(() =>
      expect(screen.getByText(/Zip download is not configured/i)).toBeDefined(),
    );
  });

  it("copies CLI snippet to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<ExportPanel project={project} onDownloadZip={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Copy CLI snippet/i }));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalled());
    await vi.waitFor(() =>
      expect(screen.getByText(/CLI commands copied/i)).toBeDefined(),
    );
  });

  it("handles clipboard copy failures", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    render(<ExportPanel project={project} onDownloadZip={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Copy CLI snippet/i }));
    await vi.waitFor(() => expect(screen.getByText(/Could not copy/i)).toBeDefined());
  });
});
