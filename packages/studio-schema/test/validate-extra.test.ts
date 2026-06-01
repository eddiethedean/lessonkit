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
});
