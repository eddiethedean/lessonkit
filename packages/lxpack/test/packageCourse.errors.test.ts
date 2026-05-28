import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { validateCourse, buildCourse } = vi.hoisted(() => ({
  validateCourse: vi.fn(),
  buildCourse: vi.fn(),
}));

vi.mock("@lxpack/api", () => ({
  validateCourse,
  buildCourse,
}));

import { packageLessonkitCourse } from "../src/packageCourse";

const tempDirs: string[] = [];

const descriptor = {
  courseId: "test-course",
  title: "Test",
  layout: "single-spa" as const,
  lessons: [{ id: "lesson-1", title: "Lesson" }],
  assessments: [],
};

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "lessonkit-lxpack-err-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  vi.clearAllMocks();
  await Promise.all(tempDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

beforeEach(() => {
  validateCourse.mockResolvedValue({ ok: true, manifest: { title: "Test" }, issues: [] });
  buildCourse.mockResolvedValue({
    ok: true,
    target: "scorm12",
    fileCount: 1,
    outputPath: "/tmp/out.zip",
    issues: [],
  });
});

describe("packageLessonkitCourse errors", () => {
  it("returns ok false when validateCourse fails", async () => {
    validateCourse.mockResolvedValueOnce({
      ok: false,
      issues: [{ severity: "error", message: "bad course", path: "title" }],
    });

    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      target: "scorm12",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.message).toContain("bad course");
    expect(buildCourse).not.toHaveBeenCalled();
  });

  it("returns ok false when buildCourse fails", async () => {
    buildCourse.mockResolvedValueOnce({
      ok: false,
      target: "scorm12",
      issues: [{ severity: "error", message: "build failed", path: "dist" }],
    });

    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      target: "scorm12",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.message).toContain("build failed");
  });
});
