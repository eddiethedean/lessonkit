import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { packageLessonkit } = vi.hoisted(() => ({
  packageLessonkit: vi.fn(),
}));

vi.mock("@lxpack/api", () => ({
  validateCourse: vi.fn(),
  buildCourse: vi.fn(),
  packageLessonkit,
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
  packageLessonkit.mockResolvedValue({
    ok: true,
    target: "scorm12",
    fileCount: 1,
    outputPath: "/tmp/out.zip",
    manifest: { title: "Test" },
    issues: [],
  });
});

describe("packageLessonkitCourse errors", () => {
  it("returns ok false when packageLessonkit fails validation", async () => {
    packageLessonkit.mockResolvedValueOnce({
      ok: false,
      target: "scorm12",
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
  });

  it("returns ok false when packageLessonkit build fails", async () => {
    packageLessonkit.mockResolvedValueOnce({
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
