import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildLessonkitProject, validateLessonkitProject } from "../src/packageCourse";

const validateCourse = vi.fn();
const buildCourse = vi.fn();

vi.mock("@lxpack/api", () => ({
  validateCourse: (...args: unknown[]) => validateCourse(...args),
  buildCourse: (...args: unknown[]) => buildCourse(...args),
}));

describe("packageCourse helpers", () => {
  beforeEach(() => {
    validateCourse.mockReset();
    buildCourse.mockReset();
  });

  it("validateLessonkitProject delegates courseDir and target to validateCourse", async () => {
    validateCourse.mockResolvedValue({ ok: true, issues: [] });

    const result = await validateLessonkitProject({ courseDir: "/tmp/course", target: "scorm12" });

    expect(validateCourse).toHaveBeenCalledWith({ courseDir: "/tmp/course", target: "scorm12" });
    expect(result.ok).toBe(true);
  });

  it("surfaces validateCourse failures", async () => {
    validateCourse.mockResolvedValue({
      ok: false,
      issues: [{ message: "invalid manifest" }],
    });

    const result = await validateLessonkitProject({ courseDir: "/tmp/course", target: "xapi" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual([{ message: "invalid manifest" }]);
    }
  });

  it("buildLessonkitProject delegates courseDir and target to buildCourse", async () => {
    buildCourse.mockResolvedValue({ ok: true, fileCount: 4, issues: [] });

    const result = await buildLessonkitProject({ courseDir: "/tmp/course", target: "standalone" });

    expect(buildCourse).toHaveBeenCalledWith({ courseDir: "/tmp/course", target: "standalone" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fileCount).toBe(4);
    }
  });
});
