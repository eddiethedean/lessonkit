import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runPackage } from "../src/commands/package.js";

const validCourse = {
  courseId: "integration-demo",
  title: "Integration Demo",
  layout: "single-spa" as const,
  lessons: [{ id: "lesson-1", title: "Lesson one" }],
  assessments: [
    {
      checkId: "ready-to-build",
      question: "Ready to build?",
      choices: ["Not yet", "Yes"],
      answer: "Yes",
      passingScore: 1,
    },
  ],
  theme: { preset: "default" as const },
};

async function writeParitySource(
  projectRoot: string,
  courseId: string,
  checkId: string,
  lessonId: string,
): Promise<void> {
  const srcDir = join(projectRoot, "src");
  await mkdir(srcDir, { recursive: true });
  await writeFile(
    join(srcDir, "App.tsx"),
    `<Course courseId="${courseId}"><Lesson lessonId="${lessonId}"><Quiz checkId="${checkId}" /></Lesson></Course>`,
    "utf8",
  );
}

async function writeValidProject(
  dir: string,
  course: typeof validCourse = validCourse,
): Promise<void> {
  await writeFile(
    join(dir, "lessonkit.json"),
    JSON.stringify({
      schemaVersion: 1,
      name: "integration-demo",
      course,
      paths: {
        spaDistDir: "dist",
        lxpackOutDir: ".lxpack/course",
        outputBaseDir: ".lxpack/out",
      },
    }),
    "utf8",
  );
  await writeFile(join(dir, "package.json"), JSON.stringify({ devDependencies: { vite: "^7" } }), "utf8");
  await mkdir(join(dir, "node_modules", "vite", "bin"), { recursive: true });
  await writeFile(join(dir, "node_modules", "vite", "bin", "vite.js"), "", "utf8");
  await mkdir(join(dir, "dist"), { recursive: true });
  await writeFile(join(dir, "dist", "index.html"), "<!DOCTYPE html><html><body>ok</body></html>", "utf8");
  const checkId = course.assessments[0]?.checkId ?? "ready-to-build";
  const lessonId = course.lessons[0]?.id ?? "lesson-1";
  await writeParitySource(dir, course.courseId, checkId, lessonId);
}

describe("runPackage integration (real lxpack validation)", () => {
  let dir: string;
  const originalNodeVersion = process.versions.node;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "lk-cli-pkg-int-"));
    Object.defineProperty(process.versions, "node", { value: "20.0.0", configurable: true });
  });

  afterEach(async () => {
    Object.defineProperty(process.versions, "node", { value: originalNodeVersion, configurable: true });
    await rm(dir, { recursive: true, force: true });
  });

  it("rejects invalid courseId with real lxpack descriptor validation", async () => {
    await writeValidProject(dir, {
      ...validCourse,
      courseId: "1bad-id",
    });

    await expect(runPackage({ target: "scorm12", cwd: dir, noBuild: true })).rejects.toMatchObject({
      code: "INVALID_PROJECT",
    });
  });

  it("packages scorm12 with real lxpack and writes output zip", async () => {
    await writeValidProject(dir);

    const result = await runPackage({ target: "scorm12", cwd: dir, noBuild: true, json: true });

    expect(result.ok).toBe(true);
    if (result.ok && result.command === "package" && result.target === "scorm12") {
      expect(result.outputPath).toBeTruthy();
      expect(existsSync(result.outputPath!)).toBe(true);
      expect(result.fileCount).toBeGreaterThan(0);
    }
  }, 30_000);

  it("rejects xapi target when tracking.xapi.activityIri is missing", async () => {
    await writeValidProject(dir, {
      ...validCourse,
      assessments: [],
    });

    await expect(runPackage({ target: "xapi", cwd: dir, noBuild: true })).rejects.toMatchObject({
      code: "PACKAGING",
    });
  }, 30_000);

  it("rejects unknown --target with INVALID_PROJECT", async () => {
    await writeValidProject(dir);

    await expect(runPackage({ target: "not-a-target", cwd: dir, noBuild: true })).rejects.toMatchObject({
      code: "INVALID_PROJECT",
      message: expect.stringContaining('Unknown target "not-a-target"'),
    });
  });

  it("rejects missing --target with TARGET_REQUIRED", async () => {
    await writeValidProject(dir);

    await expect(runPackage({ cwd: dir, noBuild: true })).rejects.toMatchObject({
      code: "TARGET_REQUIRED",
      message: expect.stringContaining("--target is required"),
    });
  });

  it("rejects absolute --out under project root but outside outDir at validation", async () => {
    await writeValidProject(dir);

    const absoluteOut = join(dir, "artifacts", "course-scorm12.zip");
    await expect(
      runPackage({ target: "scorm12", cwd: dir, noBuild: true, out: absoluteOut }),
    ).rejects.toMatchObject({
      code: "PACKAGING",
      issues: [{ path: "output", message: "output must resolve inside outDir" }],
    });
  });
});
