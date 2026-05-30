import { describe, expect, it, vi } from "vitest";
import { buildLessonkitProject, validateLessonkitProject } from "../src/packageCourse";

vi.mock("@lxpack/api", () => ({
  validateCourse: vi.fn(async () => ({ ok: true, issues: [] })),
  buildCourse: vi.fn(async () => ({ ok: true, fileCount: 1, issues: [] })),
}));

describe("packageCourse helpers", () => {
  it("validateLessonkitProject delegates to validateCourse", async () => {
    const result = await validateLessonkitProject({ courseDir: "/tmp/course", target: "scorm12" });
    expect(result.ok).toBe(true);
  });

  it("buildLessonkitProject delegates to buildCourse", async () => {
    const result = await buildLessonkitProject({ courseDir: "/tmp/course", target: "scorm12" });
    expect(result.ok).toBe(true);
  });
});
