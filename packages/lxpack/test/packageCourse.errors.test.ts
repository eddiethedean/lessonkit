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
import { writeMinimalParitySource } from "./helpers/writeMinimalParitySource";

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
  it("returns ok false for non-injectable assessment kinds", async () => {
    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");

    const packDescriptor = {
      ...descriptor,
      assessments: [
        {
          kind: "fillInBlanks" as const,
          checkId: "fib-only",
          question: "Fill",
          template: "Type *x*",
          blanks: [{ id: "b1", answer: "x" }],
        },
      ],
    };
    await writeMinimalParitySource(root, packDescriptor);

    const result = await packageLessonkitCourse({
      descriptor: packDescriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "assessments[0]")).toBe(true);
    }
  });

  it("returns ok false for unsafe output when projectRoot is set", async () => {
    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
      output: "../../../evil.zip",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "output")).toBe(true);
    }
  });

  it("returns ok false when projectRoot is omitted", async () => {
    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      target: "scorm12",
      output: "../../../evil.zip",
    } as unknown as Parameters<typeof packageLessonkitCourse>[0]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "projectRoot")).toBe(true);
    }
  });

  it("returns ok false for unsafe outputBaseDir", async () => {
    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
      outputBaseDir: "../../../evil",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "outputBaseDir")).toBe(true);
    }
  });

  it("rejects outDir outside projectRoot when projectRoot is set", async () => {
    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "..", "outside-course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.message.includes("unsafe path escapes project root"))).toBe(
        true,
      );
    }
  });

  it("returns ok false when descriptor is invalid", async () => {
    const root = await makeTempDir();
    const result = await packageLessonkitCourse({
      descriptor: { ...descriptor, courseId: "" },
      outDir: join(root, "course"),
      spaDistDir: join(root, "dist"),
      projectRoot: root,
      target: "scorm12",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "courseId" || i.message)).toBe(true);
    }
  });

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
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.message).toContain("bad course");
  });

  it("returns ok false when activityIri is not HTTPS for xapi target", async () => {
    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    const httpDescriptor = {
      ...descriptor,
      tracking: { xapi: { activityIri: "http://example.com/activity/1" } },
    };
    await writeMinimalParitySource(root, httpDescriptor);

    const result = await packageLessonkitCourse({
      descriptor: httpDescriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "xapi",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.issues.some(
          (i) =>
            i.path === "tracking.xapi.activityIri" &&
            i.message.includes("HTTPS"),
        ),
      ).toBe(true);
    }
  });

  it("returns ok false when activityIri is missing for xapi target", async () => {
    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "xapi",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "tracking.xapi.activityIri")).toBe(true);
    }
  });

  it("returns ok false when spaDistDir is missing", async () => {
    const root = await makeTempDir();
    await writeMinimalParitySource(root, descriptor);
    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: join(root, "missing-dist"),
      projectRoot: root,
      target: "scorm12",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe("spaDirs");
      expect(result.issues[0]?.message).toContain("spaDistDir not found");
    }
  });

  it("returns ok false when absolute output is outside outDir before staging", async () => {
    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
      output: join(root, "artifacts", "course-scorm12.zip"),
    });

    expect(result.ok).toBe(false);
    expect(packageLessonkit).not.toHaveBeenCalled();
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "output" && i.message === "output must resolve inside outDir")).toBe(
        true,
      );
    }
  });

  it("returns ok false when build outputPath is outside staging", async () => {
    packageLessonkit.mockResolvedValueOnce({
      ok: true,
      target: "scorm12",
      fileCount: 2,
      outputPath: "/tmp/external.zip",
      manifest: { title: "Test" },
      issues: [],
    });

    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "outputPath")).toBe(true);
      expect(result.validation?.ok).toBe(false);
    }
  });

  it("returns ok false when promote fails and deletes staging", async () => {
    packageLessonkit.mockImplementationOnce(async (opts) => {
      const { realpath } = await import("node:fs/promises");
      const stagingRoot = await realpath(String(opts.courseDir));
      return {
        ok: true,
        target: "scorm12",
        fileCount: 1,
        outputPath: join(stagingRoot, ".lxpack/out/course-scorm12.zip"),
        manifest: { title: "Test" },
        issues: [],
      };
    });

    const promoteModule = await import("../src/packaging/promote");
    const promoteSpy = vi
      .spyOn(promoteModule, "promoteStagingToOutDir")
      .mockRejectedValueOnce(new Error("promote failed"));

    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
    });

    promoteSpy.mockRestore();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe("promote");
      expect(result.issues[0]?.message).toContain("promote failed");
    }
  });

  it("returns ok false when build outputDir is outside staging", async () => {
    packageLessonkit.mockResolvedValueOnce({
      ok: true,
      target: "standalone",
      fileCount: 1,
      outputDir: "/tmp/external-standalone",
      manifest: { title: "T" },
      issues: [],
    });

    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "standalone",
      dir: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "outputDir")).toBe(true);
    }
  });

  it("returns ok false when successful build reports error-severity issues", async () => {
    packageLessonkit.mockImplementationOnce(async (opts) => {
      const { realpath } = await import("node:fs/promises");
      const stagingRoot = await realpath(String(opts.courseDir));
      return {
        ok: true,
        target: "scorm12",
        fileCount: 1,
        outputPath: join(stagingRoot, ".lxpack/out/course-scorm12.zip"),
        manifest: { title: "Test" },
        issues: [{ severity: "error", message: "fatal build issue", path: "dist" }],
      };
    });

    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.message?.includes("fatal build issue"))).toBe(true);
    }
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
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.message).toContain("build failed");
  });

  it("succeeds with parity warnings when strictParity is disabled", async () => {
    const parityModule = await import("../src/validateReactParity");
    vi.spyOn(parityModule, "validateReactManifestParity").mockReturnValueOnce([
      { path: "src/", message: "optional warning", severity: "warning" },
    ]);

    packageLessonkit.mockImplementationOnce(async (opts) => {
      const { realpath } = await import("node:fs/promises");
      const stagingRoot = await realpath(String(opts.courseDir));
      return {
        ok: true,
        target: "scorm12",
        fileCount: 1,
        outputPath: join(stagingRoot, ".lxpack/out/course-scorm12.zip"),
        manifest: { title: "Test" },
        issues: [],
      };
    });

    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
    });

    expect(result.ok).toBe(true);
  });

  it("succeeds with build warnings when strictBuild is disabled", async () => {
    packageLessonkit.mockImplementationOnce(async (opts) => {
      const { realpath } = await import("node:fs/promises");
      const stagingRoot = await realpath(String(opts.courseDir));
      return {
        ok: true,
        target: "scorm12",
        fileCount: 1,
        outputPath: join(stagingRoot, ".lxpack/out/course-scorm12.zip"),
        manifest: { title: "Test" },
        issues: [{ severity: "warning", message: "build warning", path: "dist" }],
      };
    });

    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
    });

    expect(result.ok).toBe(true);
  });

  it("returns ok false for build warnings when strictBuild is enabled", async () => {
    packageLessonkit.mockImplementationOnce(async (opts) => {
      const { realpath } = await import("node:fs/promises");
      const stagingRoot = await realpath(String(opts.courseDir));
      return {
        ok: true,
        target: "scorm12",
        fileCount: 1,
        outputPath: join(stagingRoot, ".lxpack/out/course-scorm12.zip"),
        manifest: { title: "Test" },
        issues: [{ severity: "warning", message: "build warning", path: "dist" }],
      };
    });

    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
      strictBuild: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.message?.includes("build warning"))).toBe(true);
    }
  });

  it("returns ok false for parity warnings when strictParity is enabled", async () => {
    const parityModule = await import("../src/validateReactParity");
    vi.spyOn(parityModule, "validateReactManifestParity").mockReturnValueOnce([
      { path: "src/", message: "optional warning", severity: "warning" },
    ]);

    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    await writeMinimalParitySource(root, descriptor);

    const result = await packageLessonkitCourse({
      descriptor,
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "scorm12",
      strictParity: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.severity === "warning")).toBe(true);
    }
  });
});
