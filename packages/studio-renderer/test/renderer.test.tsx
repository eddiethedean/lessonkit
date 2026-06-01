import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { loadStudioProject } from "@lessonkit-studio/schema";
import { StudioRenderer } from "../src";

const goldenRaw = {
  schemaVersion: 1,
  course: { courseId: "studio-course", title: "Studio course" },
  pages: [
    {
      id: "lesson-1",
      title: "Lesson one",
      blocks: [
        { type: "heading", id: "h1", level: 2, text: "Welcome" },
        {
          type: "scenario",
          id: "s1",
          blockId: "intro",
          blocks: [{ type: "text", id: "t1", text: "Body copy" }],
        },
        {
          type: "quiz",
          id: "q1",
          checkId: "check-1",
          question: "Ready?",
          choices: ["No", "Yes"],
          answer: "Yes",
        },
        { type: "checklist", id: "cl1", items: ["Item A"] },
      ],
    },
  ],
};

describe("@lessonkit-studio/renderer", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders course, lesson, quiz, and scenario content", () => {
    const loaded = loadStudioProject(goldenRaw);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    render(<StudioRenderer project={loaded.project} />);

    expect(screen.getByRole("heading", { level: 1, name: "Studio course" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Lesson one" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Welcome" })).toBeTruthy();
    expect(screen.getByText("Body copy")).toBeTruthy();
    expect(screen.getByText("Ready?")).toBeTruthy();
    expect(screen.getByText("Checklist (coming soon)")).toBeTruthy();
  });

  it("filters to activePageId when set", () => {
    const loaded = loadStudioProject({
      ...goldenRaw,
      pages: [
        goldenRaw.pages[0],
        { id: "lesson-2", title: "Lesson two", blocks: [{ type: "text", id: "t2", text: "Other" }] },
      ],
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    render(<StudioRenderer project={loaded.project} activePageId="lesson-1" />);

    expect(screen.getByText("Welcome")).toBeTruthy();
    expect(screen.queryByText("Other")).toBeNull();
  });

  it("shows alert for unknown activePageId", () => {
    const loaded = loadStudioProject(goldenRaw);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    render(<StudioRenderer project={loaded.project} activePageId="missing-lesson" />);

    expect(screen.getByRole("alert").textContent).toContain("missing-lesson");
  });

  it("warns in dev when project fails validation", () => {
    const loaded = loadStudioProject(goldenRaw);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const invalid = {
      ...loaded.project,
      pages: [{ ...loaded.project.pages[0]!, id: "1bad" as "lesson-1", title: "X", blocks: [] }],
    };

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
    try {
      render(<StudioRenderer project={invalid} />);
      expect(screen.getByRole("alert").textContent).toContain("Invalid Studio project");
      expect(warn).toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });
});
