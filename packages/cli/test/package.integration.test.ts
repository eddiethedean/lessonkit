import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runPackage } from "../src/commands/package.js";

function readScormManifestFromZip(zipPath: string): string {
  const unpackDir = mkdtempSync(join(tmpdir(), "lk-cli-scorm-"));
  try {
    execFileSync("unzip", ["-q", zipPath, "-d", unpackDir]);
    const direct = join(unpackDir, "imsmanifest.xml");
    if (existsSync(direct)) return readFileSync(direct, "utf8");
    for (const entry of readdirSync(unpackDir)) {
      const candidate = join(unpackDir, entry, "imsmanifest.xml");
      if (existsSync(candidate)) return readFileSync(candidate, "utf8");
    }
    throw new Error(`imsmanifest.xml missing in ${zipPath}`);
  } finally {
    rmSync(unpackDir, { recursive: true, force: true });
  }
}

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
      const manifestXml = readScormManifestFromZip(result.outputPath!);
      expect(manifestXml).toMatch(/<resource[^>]+href="[^"]+"/);
      expect(manifestXml).toContain("integration-demo");
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

  it("writes relative --out at the resolved project-root path", async () => {
    await writeValidProject(dir);

    const relativeOut = "artifacts/course-scorm12.zip";
    const expectedPath = join(dir, relativeOut);
    const wrongNestedPath = join(dir, ".lxpack/course", relativeOut);

    const result = await runPackage({
      target: "scorm12",
      cwd: dir,
      noBuild: true,
      out: relativeOut,
      json: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok && result.command === "package" && result.target === "scorm12") {
      expect(result.outputPath).toBe(expectedPath);
      expect(existsSync(expectedPath)).toBe(true);
      expect(existsSync(wrongNestedPath)).toBe(false);
    }
  }, 30_000);

  it("writes absolute --out under project root outside outDir", async () => {
    await writeValidProject(dir);

    const absoluteOut = join(dir, "artifacts", "course-scorm12.zip");
    const wrongNestedPath = join(dir, ".lxpack/course", "artifacts", "course-scorm12.zip");

    const result = await runPackage({
      target: "scorm12",
      cwd: dir,
      noBuild: true,
      out: absoluteOut,
      json: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok && result.command === "package" && result.target === "scorm12") {
      expect(result.outputPath).toBe(absoluteOut);
      expect(existsSync(absoluteOut)).toBe(true);
      expect(existsSync(wrongNestedPath)).toBe(false);
    }
  }, 30_000);
});
