import { describe, expect, it } from "vitest";
import catalogJson from "../studio-block-catalog.v2.json";
import {
  buildStudioBlockCatalog,
  loadStudioProject,
  migrateStudioProject,
  normalizeStudioProject,
  parseStudioProject,
  validateStudioProject,
} from "../src";

const goldenProject = {
  schemaVersion: 1,
  course: { courseId: "my-course", title: "My course" },
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
      ],
    },
  ],
};

describe("@lessonkit/studio-schema", () => {
  it("buildStudioBlockCatalog matches studio-block-catalog.v2.json", () => {
    expect(buildStudioBlockCatalog()).toEqual(catalogJson);
  });

  it("loadStudioProject accepts a valid golden document", () => {
    const result = loadStudioProject(goldenProject);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.course.courseId).toBe("my-course");
    expect(result.project.pages).toHaveLength(1);
    expect(result.migrationsApplied).toEqual([]);
  });

  it("migrateStudioProject coerces string schemaVersion", () => {
    const { doc, migrationsApplied } = migrateStudioProject({
      ...goldenProject,
      schemaVersion: "1",
    });
    expect((doc as { schemaVersion: number }).schemaVersion).toBe(1);
    expect(migrationsApplied).toContain("coerce-schemaVersion-string-to-number");
  });

  it("parseStudioProject rejects invalid schemaVersion", () => {
    const result = parseStudioProject({ ...goldenProject, schemaVersion: 2 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => i.path === "schemaVersion")).toBe(true);
  });

  it("validateStudioProject rejects duplicate page ids", () => {
    const parsed = parseStudioProject({
      ...goldenProject,
      pages: [
        { id: "lesson-1", title: "A", blocks: [] },
        { id: "lesson-1", title: "B", blocks: [] },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const validation = validateStudioProject(parsed.project);
    expect(validation.ok).toBe(false);
    if (validation.ok) return;
    expect(validation.issues.some((i) => i.message.includes("duplicate page id"))).toBe(true);
  });

  it("validateStudioProject rejects quiz answer not in choices", () => {
    const parsed = parseStudioProject({
      ...goldenProject,
      pages: [
        {
          id: "lesson-1",
          title: "Lesson",
          blocks: [
            {
              type: "quiz",
              id: "q1",
              checkId: "check-1",
              question: "Q?",
              choices: ["A", "B"],
              answer: "C",
            },
          ],
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const validation = validateStudioProject(parsed.project);
    expect(validation.ok).toBe(false);
  });

  it("validateStudioProject rejects invalid courseId", () => {
    const parsed = parseStudioProject({
      ...goldenProject,
      course: { courseId: "1bad", title: "T" },
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const validation = validateStudioProject(parsed.project);
    expect(validation.ok).toBe(false);
  });

  it("normalizeStudioProject fills missing block ids", () => {
    const parsed = parseStudioProject({
      schemaVersion: 1,
      course: { courseId: "course-a", title: "Course" },
      pages: [{ id: "lesson-1", title: "Lesson", blocks: [{ type: "text", id: "t1", text: "Hi" }] }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const withEmptyBlockId = {
      ...parsed.project,
      pages: [
        {
          ...parsed.project.pages[0]!,
          blocks: [{ type: "text" as const, id: "", text: "Hi" }],
        },
      ],
    };
    const normalized = normalizeStudioProject(withEmptyBlockId);
    expect(normalized.pages[0]!.blocks[0]!.id).toMatch(/^[a-z]/);
  });

  it("validateStudioProject rejects excessive container nesting", () => {
    let inner: Record<string, unknown> = { type: "text", id: "leaf", text: "x" };
    for (let d = 0; d < 10; d++) {
      inner = { type: "container", id: `c-${d}`, blocks: [inner] };
    }
    const parsed = parseStudioProject({
      schemaVersion: 1,
      course: { courseId: "course-a", title: "Course" },
      pages: [{ id: "lesson-1", title: "Lesson", blocks: [inner] }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const validation = validateStudioProject(parsed.project);
    expect(validation.ok).toBe(false);
  });
});
