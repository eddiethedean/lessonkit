import { describe, expect, it } from "vitest";
import { loadStudioProject, migrateStudioProject, parseStudioProject } from "../src";

const base = {
  schemaVersion: 1,
  course: { courseId: "course-a", title: "Course" },
  pages: [{ id: "lesson-1", title: "Lesson", blocks: [] as unknown[] }],
};

describe("@lessonkit/studio-schema parse blocks", () => {
  it("parses primitive and layout blocks", () => {
    const result = parseStudioProject({
      ...base,
      pages: [
        {
          id: "lesson-1",
          title: "Lesson",
          blocks: [
            { type: "text", id: "t1", text: "Hello" },
            { type: "heading", id: "h1", level: 1, text: "Title" },
            { type: "image", id: "i1", src: "/a.png", alt: "A" },
            { type: "button", id: "b1", label: "Go", href: "/go" },
            { type: "input", id: "in1", label: "Name", inputType: "email", placeholder: "you@" },
            {
              type: "container",
              id: "c1",
              blocks: [{ type: "text", id: "t2", text: "Nested" }],
            },
          ],
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.pages[0]!.blocks).toHaveLength(6);
  });

  it("parses stub blocks", () => {
    const result = parseStudioProject({
      ...base,
      pages: [
        {
          id: "lesson-1",
          title: "Lesson",
          blocks: [
            { type: "checklist", id: "cl1", items: ["One"] },
            { type: "video", id: "v1", src: "/v.mp4", title: "Intro" },
          ],
        },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("parses trueFalse assessment block", () => {
    const result = parseStudioProject({
      ...base,
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
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const block = result.project.pages[0]!.blocks[0]!;
    expect(block.type).toBe("trueFalse");
    if (block.type === "trueFalse") {
      expect(block.answer).toBe(true);
      expect(block.checkId).toBe("check-tf");
    }
  });

  it("parses page block with nested content", () => {
    const result = parseStudioProject({
      ...base,
      pages: [
        {
          id: "lesson-1",
          title: "Lesson",
          blocks: [
            {
              type: "page",
              id: "pg1",
              blockId: "page-block",
              title: "Intro",
              blocks: [{ type: "text", id: "t1", text: "On the page" }],
            },
          ],
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const block = result.project.pages[0]!.blocks[0]!;
    expect(block.type).toBe("page");
    if (block.type === "page") {
      expect(block.blockId).toBe("page-block");
      expect(block.blocks).toHaveLength(1);
      expect(block.blocks[0]!.type).toBe("text");
    }
  });

  it("parses interactiveBook with page chapters", () => {
    const result = parseStudioProject({
      ...base,
      pages: [
        {
          id: "lesson-1",
          title: "Lesson",
          blocks: [
            {
              type: "interactiveBook",
              id: "ib1",
              blockId: "book-1",
              title: "My Book",
              pages: [
                {
                  type: "page",
                  id: "ch1",
                  blockId: "chapter-1",
                  title: "Chapter 1",
                  blocks: [{ type: "heading", id: "h1", level: 2, text: "Start" }],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const block = result.project.pages[0]!.blocks[0]!;
    expect(block.type).toBe("interactiveBook");
    if (block.type === "interactiveBook") {
      expect(block.pages).toHaveLength(1);
      expect(block.pages[0]!.type).toBe("page");
      expect(block.pages[0]!.blocks[0]!.type).toBe("heading");
    }
  });

  it("rejects invalid block type and inputType", () => {
    const badType = parseStudioProject({
      ...base,
      pages: [{ id: "lesson-1", title: "L", blocks: [{ type: "widget", id: "w1" }] }],
    });
    expect(badType.ok).toBe(false);

    const badInput = parseStudioProject({
      ...base,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [{ type: "input", id: "i1", label: "L", inputType: "tel" }],
        },
      ],
    });
    expect(badInput.ok).toBe(false);
  });

  it("migrateStudioProject defaults missing schemaVersion", () => {
    const { doc, migrationsApplied } = migrateStudioProject({
      course: base.course,
      pages: base.pages,
    });
    expect((doc as { schemaVersion: number }).schemaVersion).toBe(1);
    expect(migrationsApplied).toContain("default-schemaVersion-1");
  });

  it("loadStudioProject returns issues when parse fails", () => {
    const result = loadStudioProject(null);
    expect(result.ok).toBe(false);
  });
});
