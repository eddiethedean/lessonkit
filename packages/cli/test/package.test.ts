import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

vi.mock("@lessonkit/lxpack", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@lessonkit/lxpack")>();
  return {
    ...actual,
    validateDescriptor: vi.fn((input: unknown) => ({ ok: true, descriptor: input })),
    validateProjectPaths: vi.fn(() => []),
    packageLessonkitCourse: vi.fn(),
  };
});

vi.mock("../src/lib/exec.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/exec.js")>();
  return {
    ...actual,
    runCommand: vi.fn().mockResolvedValue(undefined),
  };
});

import { packageLessonkitCourse, type PackageLessonkitCourseResult } from "@lessonkit/lxpack";
import { runPackage } from "../src/commands/package.js";
import { runBuild } from "../src/commands/dev.js";

const mockedPackage = vi.mocked(packageLessonkitCourse);

describe("runPackage", () => {
  let dir: string;
  const originalNodeVersion = process.versions.node;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "lk-cli-pkg-"));
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: 1,
        name: "demo",
        course: {
          courseId: "demo",
          title: "Demo",
          layout: "single-spa",
          lessons: [{ id: "l1", title: "L1" }],
        },
      }),
      "utf8",
    );
    await writeFile(join(dir, "package.json"), JSON.stringify({ devDependencies: { vite: "^7" } }), "utf8");
    await mkdir(join(dir, "node_modules", ".bin"), { recursive: true });
    await writeFile(join(dir, "node_modules", ".bin", "vite"), "", "utf8");
    await mkdir(join(dir, "dist"), { recursive: true });
    await writeFile(join(dir, "dist", "index.html"), "<html></html>", "utf8");
    Object.defineProperty(process.versions, "node", { value: "20.0.0", configurable: true });
    mockedPackage.mockReset();
  });

  afterEach(async () => {
    Object.defineProperty(process.versions, "node", { value: originalNodeVersion, configurable: true });
    await rm(dir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it("packages scorm12 via lxpack", async () => {
    mockedPackage.mockResolvedValue({
      ok: true,
      courseDir: join(dir, ".lxpack/course"),
      target: "scorm12",
      outputPath: join(dir, ".lxpack/course/.lxpack/out/course-scorm12.zip"),
      fileCount: 3,
      validation: { ok: true, issues: [], manifest: {} as never },
      build: { ok: true, issues: [], fileCount: 3, target: "scorm12", manifest: {} as never },
    } satisfies PackageLessonkitCourseResult);

    const result = await runPackage({ target: "scorm12", cwd: dir, noBuild: true, json: true });
    expect(result.ok).toBe(true);
    expect(mockedPackage).toHaveBeenCalledWith(
      expect.objectContaining({ target: "scorm12", output: ".lxpack/out/course-scorm12.zip" }),
    );
  });

  it("returns dist path for react-vite", async () => {
    const result = await runPackage({ target: "react-vite", cwd: dir, json: true });
    expect(result.ok).toBe(true);
    expect(result).toMatchObject({ target: "react-vite", distDir: join(dir, "dist") });
  });

  it("surfaces packaging failures", async () => {
    mockedPackage.mockResolvedValue({
      ok: false,
      courseDir: join(dir, ".lxpack/course"),
      target: "scorm12",
      issues: [{ message: "validation failed" }],
    });

    await expect(runPackage({ target: "scorm12", cwd: dir, noBuild: true })).rejects.toMatchObject({
      exitCode: 3,
      code: "PACKAGING",
    });
  });

  it("rejects lxpack targets on Node 18", async () => {
    Object.defineProperty(process.versions, "node", { value: "18.0.0", configurable: true });
    await expect(runPackage({ target: "scorm12", cwd: dir, noBuild: true })).rejects.toMatchObject({
      code: "NODE_VERSION",
    });
  });
});

describe("runBuild integration", () => {
  it("exports runBuild from dev module", () => {
    expect(typeof runBuild).toBe("function");
  });
});
