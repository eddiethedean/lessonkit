import { describe, expect, it } from "vitest";
import { parseStudioProject, validateStudioProject } from "../src";

describe("@lessonkit/studio-schema validate extras", () => {
  it("rejects duplicate block ids and invalid checkId", () => {
    const parsed = parseStudioProject({
      schemaVersion: 1,
      course: { courseId: "course-a", title: "C" },
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            { type: "text", id: "dup", text: "a" },
            { type: "text", id: "dup", text: "b" },
          ],
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const v = validateStudioProject(parsed.project);
    expect(v.ok).toBe(false);
  });

  it("rejects empty course title and unsupported schema version", () => {
    const parsed = parseStudioProject({
      schemaVersion: 1,
      course: { courseId: "course-a", title: "C" },
      pages: [{ id: "lesson-1", title: "L", blocks: [] }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const emptyTitle = validateStudioProject({
      ...parsed.project,
      course: { ...parsed.project.course, title: "   " },
    });
    expect(emptyTitle.ok).toBe(false);

    const badVersion = validateStudioProject({
      ...parsed.project,
      schemaVersion: 2 as 1,
    });
    expect(badVersion.ok).toBe(false);
  });

  it("rejects empty checklist items and duplicate checkId", () => {
    const parsed = parseStudioProject({
      schemaVersion: 1,
      course: { courseId: "course-a", title: "C" },
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            {
              type: "quiz",
              id: "q1",
              checkId: "dup-check",
              question: "Q1?",
              choices: ["a", "b"],
              answer: "a",
            },
          ],
        },
        {
          id: "lesson-2",
          title: "L2",
          blocks: [
            {
              type: "quiz",
              id: "q2",
              checkId: "dup-check",
              question: "Q2?",
              choices: ["x", "y"],
              answer: "x",
            },
          ],
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const dupCheck = validateStudioProject(parsed.project);
    expect(dupCheck.ok).toBe(false);
    if (!dupCheck.ok) {
      expect(dupCheck.issues.some((i) => i.message.includes("duplicate checkId"))).toBe(true);
    }

    const emptyChecklist = validateStudioProject({
      ...parsed.project,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [{ type: "checklist", id: "cl1", items: [] }],
        },
      ],
    });
    expect(emptyChecklist.ok).toBe(false);
    if (!emptyChecklist.ok) {
      expect(emptyChecklist.issues.some((i) => i.path.endsWith(".items"))).toBe(true);
    }
  });

  it("rejects invalid inputType and empty text", () => {
    const parsed = parseStudioProject({
      schemaVersion: 1,
      course: { courseId: "course-a", title: "C" },
      pages: [{ id: "lesson-1", title: "L", blocks: [{ type: "text", id: "t1", text: "ok" }] }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const emptyText = validateStudioProject({
      ...parsed.project,
      pages: [{ id: "lesson-1", title: "L", blocks: [{ type: "text", id: "t1", text: "  " }] }],
    });
    expect(emptyText.ok).toBe(false);

    const badInput = validateStudioProject({
      ...parsed.project,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            {
              type: "input",
              id: "in1",
              label: "Email",
              inputType: "password" as "text",
            },
          ],
        },
      ],
    });
    expect(badInput.ok).toBe(false);
  });

  it("rejects empty content fields on primitive blocks", () => {
    const parsed = parseStudioProject({
      schemaVersion: 1,
      course: { courseId: "course-a", title: "C" },
      pages: [{ id: "lesson-1", title: "L", blocks: [{ type: "text", id: "t0", text: "ok" }] }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const page = { id: "lesson-1" as const, title: "L" };
    const cases = [
      { blocks: [{ type: "heading" as const, id: "h1", level: 2 as const, text: "  " }] },
      { blocks: [{ type: "image" as const, id: "img1", src: " ", alt: "" }] },
      { blocks: [{ type: "video" as const, id: "vid1", src: "" }] },
      { blocks: [{ type: "button" as const, id: "btn1", label: "   " }] },
      { blocks: [{ type: "input" as const, id: "in1", label: "" }] },
      {
        blocks: [
          {
            type: "quiz" as const,
            id: "qz1",
            checkId: "qz-check",
            question: "  ",
            choices: ["a"],
            answer: "a",
          },
        ],
      },
    ];

    for (const { blocks } of cases) {
      const project = {
        ...parsed.project,
        pages: [{ ...page, blocks }],
      };
      const result = validateStudioProject(project);
      expect(result.ok).toBe(false);
    }

    const emptyChoices = validateStudioProject({
      ...parsed.project,
      pages: [
        {
          ...page,
          blocks: [
            {
              type: "quiz" as const,
              id: "qz3",
              checkId: "qz-check-3",
              question: "Q?",
              choices: ["   "],
              answer: "   ",
            },
          ],
        },
      ],
    });
    expect(emptyChoices.ok).toBe(false);
  });
});
