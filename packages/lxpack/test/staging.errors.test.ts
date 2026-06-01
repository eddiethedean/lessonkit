import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildStagingPackage } from "../src/packaging/staging";

const tempDirs: string[] = [];
afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

const { packageLessonkit } = vi.hoisted(() => ({
  packageLessonkit: vi.fn(),
}));

vi.mock("@lxpack/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@lxpack/api")>();
  return {
    ...actual,
    packageLessonkit,
  };
});

const descriptor = {
  courseId: "test-course",
  title: "Test",
  layout: "single-spa" as const,
  lessons: [{ id: "lesson-1", title: "Lesson" }],
};

describe("buildStagingPackage errors", () => {
  it("rethrows unexpected errors after cleaning staging", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-staging-throw-"));
    tempDirs.push(root);
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");

    packageLessonkit.mockRejectedValueOnce(new Error("boom"));
    await expect(
      buildStagingPackage({
        descriptor,
        outDir: join(root, "out"),
        spaDistDir: dist,
        target: "scorm12",
      }),
    ).rejects.toThrow("boom");
  });
});
