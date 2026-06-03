import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Course, Lesson } from "@lessonkit/react";
import { loadStudioProject } from "@lessonkit/studio-schema";
import { renderBlock } from "../src";

function wrapLesson(children: React.ReactNode) {
  return (
    <Course title="Test course" courseId="test-course" config={{ xapi: { enabled: false } }}>
      <Lesson title="Lesson" lessonId="lesson-1">
        {children}
      </Lesson>
    </Course>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("@lessonkit/studio-renderer learning blocks", () => {
  it("renders TrueFalse assessment", () => {
    const loaded = loadStudioProject({
      schemaVersion: 1,
      course: { courseId: "learn-course", title: "Learn" },
      pages: [
        {
          id: "lesson-1",
          title: "Lesson",
          blocks: [
            {
              type: "trueFalse",
              id: "tf1",
              checkId: "check-tf",
              question: "The sky is blue.",
              answer: true,
            },
          ],
        },
      ],
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    render(wrapLesson(renderBlock(loaded.project.pages[0]!.blocks[0]!)));
    expect(screen.getByText("The sky is blue.")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "True" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "False" })).toBeTruthy();
  });

  it("renders InteractiveBook with nested page content", () => {
    const loaded = loadStudioProject({
      schemaVersion: 1,
      course: { courseId: "book-course", title: "Book" },
      pages: [
        {
          id: "lesson-1",
          title: "Lesson",
          blocks: [
            {
              type: "interactiveBook",
              id: "book1",
              blockId: "book-block",
              title: "Study guide",
              pages: [
                {
                  type: "page",
                  id: "page1",
                  blockId: "page-block",
                  title: "Intro",
                  blocks: [{ type: "text", id: "t1", text: "First chapter" }],
                },
                {
                  type: "page",
                  id: "page2",
                  blockId: "page-block-2",
                  title: "Next",
                  blocks: [{ type: "text", id: "t2", text: "Second chapter" }],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    render(wrapLesson(renderBlock(loaded.project.pages[0]!.blocks[0]!)));
    expect(screen.getByText("Study guide")).toBeTruthy();
    expect(screen.getByText("First chapter")).toBeTruthy();
  });
});
