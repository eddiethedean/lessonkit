import { EventEmitter } from "node:events";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { spawn } from "node:child_process";
import { packageLessonkitCourse } from "@lessonkit/lxpack";
import type { PackageLessonkitCourseResult } from "@lessonkit/lxpack";
import {
  packageStudioProject,
  writeLxpackProjectFromStudio,
  writeReactViteProject,
} from "../src/lxpackExport";
import { sampleProject } from "./fixtures/sampleProject";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

vi.mock("@lessonkit/lxpack", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@lessonkit/lxpack")>();
  return {
    ...actual,
    packageLessonkitCourse: vi.fn(),
  };
});

const mockedSpawn = vi.mocked(spawn);
const mockedPackage = vi.mocked(packageLessonkitCourse);

function mockSpawnSuccess(): void {
  mockedSpawn.mockImplementation(() => {
    const child = new EventEmitter() as EventEmitter & { on: EventEmitter["on"] };
    queueMicrotask(() => child.emit("close", 0));
    return child as never;
  });
}

describe("lxpackExport", () => {
  const tempDirs: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("writeReactViteProject throws when project is invalid", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lk-invalid-"));
    tempDirs.push(dir);
    await expect(
      writeReactViteProject({ ...sampleProject, pages: [] }, { outDir: dir }),
    ).rejects.toThrow(/pages/);
  });

  it("writeReactViteProject copies assets when assetsDir is set", async () => {
    const assetsDir = await mkdtemp(join(tmpdir(), "lk-assets-"));
    const outDir = await mkdtemp(join(tmpdir(), "lk-out-"));
    tempDirs.push(assetsDir, outDir);
    await mkdir(join(assetsDir, "assets"), { recursive: true });
    await writeFile(join(assetsDir, "assets/logo.png"), "png", "utf8");

    const project = {
      ...sampleProject,
      pages: [
        {
          id: "lesson-1",
          title: "Lesson",
          blocks: [{ type: "image" as const, id: "img", src: "assets/logo.png", alt: "Logo" }],
        },
      ],
    };

    await writeReactViteProject(project, { outDir, assetsDir, exportMode: "renderer" });
    const copied = await import("node:fs/promises").then((fs) =>
      fs.readFile(join(outDir, "assets/logo.png"), "utf8"),
    );
    expect(copied).toBe("png");
  });

  it("writeLxpackProjectFromStudio throws when project is invalid", async () => {
    await expect(
      writeLxpackProjectFromStudio({ ...sampleProject, pages: [] }, { outDir: "/tmp/lx" }),
    ).rejects.toThrow(/pages/);
  });

  it("packageStudioProject runs install, build, and packages course", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lk-pack-"));
    tempDirs.push(dir);
    mockSpawnSuccess();
    mockedPackage.mockResolvedValue({
      ok: true,
      courseDir: dir,
      target: "scorm12",
      outputPath: join(dir, "course.zip"),
      fileCount: 1,
      validation: { ok: true, issues: [], manifest: {} as never },
      build: { ok: true, issues: [], fileCount: 1, target: "scorm12", manifest: {} as never },
    } satisfies PackageLessonkitCourseResult);

    const result = await packageStudioProject(sampleProject, {
      outDir: dir,
      target: "scorm12",
    });

    expect(result.ok).toBe(true);
    expect(mockedSpawn).toHaveBeenCalledTimes(2);
    expect(mockedPackage).toHaveBeenCalledOnce();
  });

  it("packageStudioProject rejects failed npm commands", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lk-pack-fail-"));
    tempDirs.push(dir);
    mockedSpawn.mockImplementation(() => {
      const child = new EventEmitter() as EventEmitter & { on: EventEmitter["on"] };
      queueMicrotask(() => child.emit("close", 1));
      return child as never;
    });

    await expect(
      packageStudioProject(sampleProject, { outDir: dir, target: "scorm12" }),
    ).rejects.toThrow(/exited with code 1/);
  });

  it("runCommand reports unknown exit code", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lk-pack-null-"));
    tempDirs.push(dir);
    mockedSpawn.mockImplementation(() => {
      const child = new EventEmitter() as EventEmitter & { on: EventEmitter["on"] };
      queueMicrotask(() => child.emit("close", null));
      return child as never;
    });

    await expect(
      packageStudioProject(sampleProject, { outDir: dir, target: "scorm12" }),
    ).rejects.toThrow(/unknown/);
  });

  it("writeReactViteProject skips asset copy when no asset paths are referenced", async () => {
    const assetsDir = await mkdtemp(join(tmpdir(), "lk-assets-empty-"));
    const outDir = await mkdtemp(join(tmpdir(), "lk-out-empty-"));
    tempDirs.push(assetsDir, outDir);
    await writeReactViteProject(sampleProject, { outDir, assetsDir, exportMode: "renderer" });
  });

  it("writeLxpackProjectFromStudio uses paths.spaDistDir fallback", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-lxpack-paths-"));
    tempDirs.push(root);
    const dist = join(root, "build");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf8");
    const result = await writeLxpackProjectFromStudio(sampleProject, {
      outDir: join(root, ".lxpack/course"),
      paths: { spaDistDir: "build" },
      projectRoot: root,
    });
    expect(result.lessonkitJsonPath).toContain("lessonkit.json");
  });
});
