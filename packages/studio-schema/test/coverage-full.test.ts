import { describe, expect, it } from "vitest";
import { buildStudioBlockCatalog } from "../src/catalog";
import { loadStudioProject, migrateStudioProject, normalizeStudioProject, parseStudioProject, validateStudioProject } from "../src";
import { isRecord, parsePositiveInt, parseString, pushIssue } from "../src/parseUtils";
import type { StudioValidationIssue } from "../src/types";

const base = {
  schemaVersion: 1,
  course: { courseId: "course-a", title: "Course" },
  pages: [{ id: "lesson-1", title: "Lesson", blocks: [] as unknown[] }],
};

describe("@lessonkit-studio/schema coverage", () => {
  it("parseUtils handles optional and invalid values", () => {
    const issues: StudioValidationIssue[] = [];
    expect(parseString(undefined, "p", issues, { required: false })).toBeUndefined();
    expect(issues).toHaveLength(0);

    const issues2: StudioValidationIssue[] = [];
    expect(parseString(42, "p", issues2)).toBeUndefined();
    expect(issues2[0]?.message).toContain("must be a string");

    const issues3: StudioValidationIssue[] = [];
    expect(parseString("  ", "p", issues3, { required: false, trim: true })).toBe("");

    const issues4: StudioValidationIssue[] = [];
    expect(parsePositiveInt(1.5, "p", issues4, [1, 2, 3])).toBeUndefined();
    const issues5: StudioValidationIssue[] = [];
    expect(parsePositiveInt(9, "p", issues5, [1, 2, 3])).toBeUndefined();

    const issues6: StudioValidationIssue[] = [];
    pushIssue(issues6, "x", "msg");
    expect(issues6).toHaveLength(1);
    expect(isRecord(null)).toBe(false);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it("parseStudioProject reports structural errors", () => {
    expect(parseStudioProject(null).ok).toBe(false);

    const notArray = parseStudioProject({ ...base, pages: "nope" });
    expect(notArray.ok).toBe(false);

    const badBlock = parseStudioProject({
      ...base,
      pages: [{ id: "lesson-1", title: "L", blocks: [null] }],
    });
    expect(badBlock.ok).toBe(false);

    const notObjectBlock = parseStudioProject({
      ...base,
      pages: [{ id: "lesson-1", title: "L", blocks: ["x"] }],
    });
    expect(notObjectBlock.ok).toBe(false);

    const missingType = parseStudioProject({
      ...base,
      pages: [{ id: "lesson-1", title: "L", blocks: [{ id: "b1" }] }],
    });
    expect(missingType.ok).toBe(false);

    const badHeading = parseStudioProject({
      ...base,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [{ type: "heading", id: "h1", level: 4, text: "T" }],
        },
      ],
    });
    expect(badHeading.ok).toBe(false);

    const noText = parseStudioProject({
      ...base,
      pages: [{ id: "lesson-1", title: "L", blocks: [{ type: "text", id: "t1", text: "" }] }],
    });
    expect(noText.ok).toBe(false);

    const quizBadChoices = parseStudioProject({
      ...base,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            {
              type: "quiz",
              id: "q1",
              checkId: "c1",
              question: "Q",
              choices: "not-array",
              answer: "A",
            },
          ],
        },
      ],
    });
    expect(quizBadChoices.ok).toBe(false);

    const quizEmptyChoices = parseStudioProject({
      ...base,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            {
              type: "quiz",
              id: "q1",
              checkId: "c1",
              question: "Q",
              choices: ["  "],
              answer: "A",
            },
          ],
        },
      ],
    });
    expect(quizEmptyChoices.ok).toBe(false);

    const checklistBad = parseStudioProject({
      ...base,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [{ type: "checklist", id: "cl1", items: "nope" }],
        },
      ],
    });
    expect(checklistBad.ok).toBe(false);

    const badPage = parseStudioProject({
      ...base,
      pages: [null],
    });
    expect(badPage.ok).toBe(false);

    const badCourse = parseStudioProject({
      schemaVersion: 1,
      course: null,
      pages: base.pages,
    });
    expect(badCourse.ok).toBe(false);

    const blocksNotArray = parseStudioProject({
      ...base,
      pages: [{ id: "lesson-1", title: "L", blocks: {} }],
    });
    expect(blocksNotArray.ok).toBe(false);

    const checklistEmpty = parseStudioProject({
      ...base,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [{ type: "checklist", id: "cl1", items: ["", "  "] }],
        },
      ],
    });
    expect(checklistEmpty.ok).toBe(false);
  });

  it("loadStudioProject returns validation issues after parse", () => {
    const result = loadStudioProject({
      schemaVersion: 1,
      course: { courseId: "course-a", title: "C" },
      pages: [],
    });
    expect(result.ok).toBe(false);
  });

  it("migrateStudioProject passes through non-objects", () => {
    const result = migrateStudioProject("string");
    expect(result.doc).toBe("string");
    expect(result.migrationsApplied).toEqual([]);
  });

  it("validateStudioProject covers identity and title edge cases", () => {
    const parsed = parseStudioProject({
      schemaVersion: 1,
      course: { courseId: "course-a", title: "C" },
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            { type: "text", id: "1bad", text: "x" },
            {
              type: "quiz",
              id: "q1",
              checkId: "1bad",
              question: "Q",
              choices: ["A"],
              answer: "A",
            },
            {
              type: "scenario",
              id: "s1",
              blockId: "1bad",
              blocks: [],
            },
          ],
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const v = validateStudioProject(parsed.project);
    expect(v.ok).toBe(false);

    const emptyTitle = validateStudioProject({
      ...parsed.project,
      pages: [{ ...parsed.project.pages[0]!, title: "   " }],
    });
    expect(emptyTitle.ok).toBe(false);

    const badLesson = validateStudioProject({
      ...parsed.project,
      pages: [{ ...parsed.project.pages[0]!, id: "1bad" as "lesson-1" }],
    });
    expect(badLesson.ok).toBe(false);
  });

  it("normalizeStudioProject covers container, button href, and derived ids", () => {
    const parsed = parseStudioProject({
      schemaVersion: 1,
      course: { courseId: "course-a", title: "My Course Title" },
      pages: [
        {
          id: "lesson-1",
          title: "  Page title  ",
          blocks: [
            {
              type: "container",
              id: "c1",
              blocks: [{ type: "button", id: "b1", label: " Link ", href: " /x " }],
            },
            { type: "input", id: "i1", label: "L", inputType: "number", placeholder: "p" },
          ],
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const normalized = normalizeStudioProject(parsed.project);
    expect(normalized.course.courseId).toBe("course-a");
    expect(normalized.pages[0]!.id).toBe("lesson-1");
    expect(normalized.pages[0]!.title).toBe("Page title");
    const container = normalized.pages[0]!.blocks[0];
    expect(container?.type).toBe("container");
    if (container?.type === "container") {
      expect(container.blocks[0]?.type).toBe("button");
      if (container.blocks[0]?.type === "button") {
        expect(container.blocks[0].href).toBe("/x");
      }
    }
  });

  it("normalizeStudioProject derives courseId from title when blank", () => {
    const parsed = parseStudioProject({
      schemaVersion: 1,
      course: { courseId: "course-a", title: "Fallback Title" },
      pages: [{ id: "lesson-1", title: "L", blocks: [] }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const normalized = normalizeStudioProject({
      ...parsed.project,
      course: { courseId: "", title: "Fallback Title" },
    });
    expect(normalized.course.courseId).toMatch(/^[a-z]/);
  });

  it("buildStudioBlockCatalog is exported", () => {
    expect(buildStudioBlockCatalog().entries.length).toBeGreaterThan(0);
  });
});
