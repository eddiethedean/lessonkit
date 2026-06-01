import { describe, expect, it } from "vitest";
import { loadStudioProject, normalizeStudioProject, parseStudioProject } from "../src";

describe("@lessonkit/studio-schema normalize", () => {
  it("normalizes all block variants", () => {
    const parsed = parseStudioProject({
      schemaVersion: 1,
      course: { courseId: "  course-a  ", title: "  Course  " },
      pages: [
        {
          id: "lesson-1",
          title: "  Lesson  ",
          blocks: [
            { type: "text", id: "t1", text: "  hi  " },
            { type: "heading", id: "h1", level: 2, text: "  H  " },
            { type: "image", id: "i1", src: " /a.png ", alt: " alt " },
            { type: "button", id: "b1", label: " Go ", href: " /x " },
            { type: "input", id: "in1", label: " L ", placeholder: " p " },
            {
              type: "quiz",
              id: "q1",
              checkId: " check-1 ",
              question: " Q ",
              choices: [" A "],
              answer: " A ",
            },
            {
              type: "scenario",
              id: "s1",
              blockId: " blk ",
              blocks: [{ type: "text", id: "t2", text: "n" }],
            },
            { type: "checklist", id: "cl1", items: [" item "] },
            { type: "video", id: "v1", src: " /v ", title: " T " },
          ],
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const normalized = normalizeStudioProject(parsed.project);
    expect(normalized.course.title).toBe("Course");
    expect(normalized.pages[0]!.blocks[0]).toMatchObject({ type: "text", text: "hi" });
  });

  it("loadStudioProject fails validation after parse", () => {
    const result = loadStudioProject({
      schemaVersion: 1,
      course: { courseId: "course-a", title: "C" },
      pages: [],
    });
    expect(result.ok).toBe(false);
  });
});
