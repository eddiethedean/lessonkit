import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";
import { ASSESSMENT_CHECK_IDS, SHOWCASE_META } from "./constants";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("framework 1.1 showcase App", () => {
  afterEach(() => cleanup());

  it("renders the course shell and foundation lesson", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    render(<App />);
    expect(screen.getByText("Incident Response")).toBeDefined();
    expect(screen.getByText(/Structure — Course, Lesson, Scenario/)).toBeDefined();
    expect(screen.getByLabelText("Blocks in this lesson")).toBeDefined();
    expect(screen.getByText("Reflection")).toBeDefined();
    vi.mocked(console.log).mockRestore();
  });

  it("navigates to signal triage", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByTestId("lesson-nav-signal-triage").getAttribute("aria-current")).toBe("step");
    expect(screen.getByText("KnowledgeCheck")).toBeDefined();
    vi.mocked(console.log).mockRestore();
  });

  it("walks the full curriculum and shows block chips per lesson", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    render(<App />);

    for (const lesson of SHOWCASE_META.lessons) {
      fireEvent.click(screen.getByTestId(`lesson-nav-${lesson.id}`));
      expect(screen.getByTestId(`lesson-nav-${lesson.id}`).getAttribute("aria-current")).toBe("step");
      const legend = screen.getByLabelText("Blocks in this lesson");
      for (const block of lesson.blocks) {
        expect(within(legend).getByText(block)).toBeDefined();
      }
    }

    vi.mocked(console.log).mockRestore();
  });

  it("renders sidebar navigation controls", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    render(<App />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDefined();
    expect(screen.getByRole("group", { name: "Display theme" })).toBeDefined();
    vi.mocked(console.log).mockRestore();
  });
});

describe("framework 1.1 showcase lessonkit.json", () => {
  it("declares a single-spa shell lesson and every assessment checkId", () => {
    const manifest = JSON.parse(readFileSync(join(root, "lessonkit.json"), "utf8")) as {
      schemaVersion: number;
      course: {
        courseId: string;
        layout: string;
        spaLessonId: string;
        lessons: { id: string }[];
        assessments: { checkId: string }[];
      };
    };

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.course.layout).toBe("single-spa");
    expect(manifest.course.courseId).toBe(SHOWCASE_META.courseId);
    expect(manifest.course.lessons.length).toBe(1);
    expect(manifest.course.lessons[0]?.id).toBe(manifest.course.spaLessonId);
    const manifestIds = manifest.course.assessments.map((a) => a.checkId).sort();
    const expectedIds = [...ASSESSMENT_CHECK_IDS].sort();
    expect(manifestIds).toEqual(expectedIds);
  });
});
