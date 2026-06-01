import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { loadStudioProject } from "@lessonkit/studio-schema";
import { StudioRenderer, renderBlock, renderPageBlocks } from "../src";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("@lessonkit/studio-renderer coverage", () => {
  it("renders container, button link, and heading levels", () => {
    const loaded = loadStudioProject({
      schemaVersion: 1,
      course: { courseId: "cov-course", title: "Cov" },
      pages: [
        {
          id: "lesson-1",
          title: "Lesson",
          blocks: [
            { type: "heading", id: "h1", level: 1, text: "Title one" },
            {
              type: "container",
              id: "wrap",
              blocks: [
                { type: "button", id: "btn-link", label: "Go", href: "https://example.com" },
                { type: "text", id: "inner", text: "Inside container" },
              ],
            },
          ],
        },
      ],
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    render(<StudioRenderer project={loaded.project} className="custom-root" />);
    expect(document.querySelector(".custom-root")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Title one" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go" }).getAttribute("href")).toBe(
      "https://example.com",
    );
    expect(screen.getByText("Inside container")).toBeTruthy();
  });

  it("renderBlock and renderPageBlocks render checklist", () => {
    const loaded = loadStudioProject({
      schemaVersion: 1,
      course: { courseId: "cov-course", title: "Cov" },
      pages: [
        {
          id: "lesson-1",
          title: "Lesson",
          blocks: [{ type: "checklist", id: "cl1", items: ["A", "B"] }],
        },
      ],
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
    try {
      render(<div>{renderPageBlocks(loaded.project.pages[0]!.blocks)}</div>);
      expect(screen.getByText("Checklist (coming soon)")).toBeTruthy();
      expect(warn).toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("video block uses title in aria-label when provided", () => {
    const withTitle = {
      type: "video" as const,
      id: "v1",
      src: "/clip.mp4",
      title: "Intro clip",
    };
    const { unmount } = render(<div>{renderBlock(withTitle)}</div>);
    expect(screen.getByLabelText("Intro clip")).toBeTruthy();
    unmount();

    render(<div>{renderBlock({ type: "video", id: "v2", src: "/x.mp4" })}</div>);
    expect(screen.getByLabelText("Video (preview stub)")).toBeTruthy();
  });

  it("input block defaults inputType to text", () => {
    const loaded = loadStudioProject({
      schemaVersion: 1,
      course: { courseId: "cov-course", title: "Cov" },
      pages: [
        {
          id: "lesson-1",
          title: "Lesson",
          blocks: [{ type: "input", id: "inp", label: "Name" }],
        },
      ],
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    render(<div>{renderBlock(loaded.project.pages[0]!.blocks[0]!)}</div>);
    expect(screen.getByLabelText("Name").getAttribute("type")).toBe("text");
  });

  it("skips dev validation in production", () => {
    const loaded = loadStudioProject({
      schemaVersion: 1,
      course: { courseId: "cov-course", title: "Cov" },
      pages: [{ id: "lesson-1", title: "Lesson", blocks: [] }],
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const invalid = {
      ...loaded.project,
      pages: [{ ...loaded.project.pages[0]!, id: "1bad" as "lesson-1", title: "X", blocks: [] }],
    };

    vi.stubEnv("NODE_ENV", "production");
    try {
      expect(() => render(<StudioRenderer project={invalid} />)).toThrow();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
