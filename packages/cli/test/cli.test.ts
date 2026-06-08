import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile, mkdir, readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { createProgram, run } from "../src/index.js";
import { runInit, __testInitHelpers } from "../src/commands/init.js";
import { formatCliError, CliError, EXIT_INVALID_PROJECT } from "../src/lib/errors.js";
import { findProjectRoot, loadLessonkitJson } from "../src/lib/project.js";
import { parsePackageTarget, resolvePackageOutput, resolveViteBuildArgs, resolveViteBuildArgv, stripOutDirFromViteArgs } from "../src/lib/paths.js";
import * as exec from "../src/lib/exec.js";

describe("@lessonkit/cli program", () => {
  it("CLI template App.tsx ids match lessonkit.json", async () => {
    const templateDir = join(dirname(fileURLToPath(import.meta.url)), "../template/vite-react");
    const lessonkit = JSON.parse(await readFile(join(templateDir, "lessonkit.json"), "utf8")) as {
      course: {
        courseId: string;
        lessons: { id: string }[];
        assessments?: { checkId: string }[];
      };
    };
    const appSource = await readFile(join(templateDir, "src/App.tsx"), "utf8");

    expect(appSource).toContain(`courseId="${lessonkit.course.courseId}"`);
    for (const lesson of lessonkit.course.lessons) {
      expect(appSource).toContain(`lessonId="${lesson.id}"`);
    }
    for (const assessment of lessonkit.course.assessments ?? []) {
      expect(appSource).toContain(`checkId="${assessment.checkId}"`);
    }
  });

  it("createProgram wires basic metadata", () => {
    const program = createProgram({ log: () => {}, error: () => {} });
    expect(program.name()).toBe("lessonkit");
    expect(program.description()).toBe("LessonKit CLI");
  });

  it("blocks list prints TSV without --json", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await run(["node", "lessonkit", "blocks", "list"], { log: () => {}, error: () => {} });
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining("type\tcategory\th5pMachineName"));
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining("TrueFalse"));
    consoleLog.mockRestore();
  });

  it("blocks list --category filters entries", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await run(
      ["node", "lessonkit", "blocks", "list", "--json", "--category", "assessment"],
      { log: () => {}, error: () => {} },
    );
    const payload = JSON.parse(consoleLog.mock.calls[0]![0] as string) as {
      count: number;
      entries: Array<{ category?: string }>;
    };
    expect(payload.count).toBeGreaterThan(0);
    expect(payload.entries.every((e) => e.category === "assessment")).toBe(true);
    consoleLog.mockRestore();
  });

  it("blocks list --tier B returns assessment blocks", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await run(["node", "lessonkit", "blocks", "list", "--json", "--tier", "B"], {
      log: () => {},
      error: () => {},
    });
    const payload = JSON.parse(consoleLog.mock.calls[0]![0] as string) as {
      ok: boolean;
      count: number;
      entries: Array<{ type: string; tier?: string }>;
    };
    expect(payload.ok).toBe(true);
    expect(payload.count).toBeGreaterThan(0);
    expect(payload.entries.every((e) => e.tier === "B")).toBe(true);
    expect(payload.entries.some((e) => e.type === "TrueFalse")).toBe(true);
    consoleLog.mockRestore();
  });

  it("blocks list --json includes TrueFalse with h5pMachineName", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await run(["node", "lessonkit", "blocks", "list", "--json"], { log: () => {}, error: () => {} });
    const payload = JSON.parse(consoleLog.mock.calls[0]![0] as string) as {
      ok: boolean;
      count: number;
      entries: Array<{ type: string; h5pMachineName?: string }>;
    };
    expect(payload.ok).toBe(true);
    expect(payload.count).toBe(57);
    const trueFalse = payload.entries.find((e) => e.type === "TrueFalse");
    expect(trueFalse?.h5pMachineName).toBe("H5P.TrueFalse");
    consoleLog.mockRestore();
  });

  it("publish remains a stub", async () => {
    const log = vi.fn();
    await run(["node", "lessonkit", "publish"], { log, error: () => {} });
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("lessonkit publish is not implemented"),
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining("RELEASING.md"));
  });

  it("export logs human-readable success without --json", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-cli-export-"));
    const manifest = {
      schemaVersion: 1 as const,
      name: "export-cli-test",
      course: {
        courseId: "export-cli-test",
        title: "Export CLI Test",
        layout: "single-spa" as const,
        lessons: [{ id: "lesson-1", title: "Lesson one" }],
        theme: { preset: "default" as const },
      },
      paths: {
        spaDistDir: "dist",
        lxpackOutDir: ".lxpack/course",
        outputBaseDir: ".lxpack/out",
      },
    };
    await writeFile(join(root, "lessonkit.json"), JSON.stringify(manifest));
    await writeFile(join(root, "package.json"), JSON.stringify({ name: "export-cli-test" }));
    await mkdir(join(root, "dist", "assets"), { recursive: true });
    await writeFile(join(root, "dist", "index.html"), "<!doctype html><html></html>\n");
    await writeFile(join(root, "dist", "assets", "app.js"), "console.log('ok');\n");

    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await run(
      ["node", "lessonkit", "export", "--no-build", "--cwd", root],
      { log: () => {}, error: () => {} },
    );
    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringMatching(/Exported \.lkcourse → .+ \(\d+ files\)/),
    );
    consoleLog.mockRestore();
    await rm(root, { recursive: true, force: true });
  });

  it("package requires --target", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit:${code ?? 0}`);
    }) as typeof process.exit);
    await expect(run(["node", "lessonkit", "package"], { log: () => {}, error: () => {} })).rejects.toThrow(
      /exit:1/,
    );
    exit.mockRestore();
  });
});

describe("formatCliError", () => {
  it("formats CliError with issues", () => {
    const err = new CliError("Invalid course", {
      code: "INVALID_PROJECT",
      exitCode: 2,
      issues: [{ path: "course.lessons", message: "required" }],
    });
    const formatted = formatCliError(err);
    expect(formatted.exitCode).toBe(2);
    expect(formatted.message).toContain("course.lessons");
    expect(formatted.json.ok).toBe(false);
  });
});

describe("parsePackageTarget", () => {
  it("accepts valid targets", () => {
    expect(parsePackageTarget("scorm12")).toBe("scorm12");
    expect(parsePackageTarget("react-vite")).toBe("react-vite");
  });

  it("rejects unknown targets", () => {
    expect(() => parsePackageTarget("invalid")).toThrow(/Unknown target/);
  });
});

describe("resolvePackageOutput", () => {
  it("resolves scorm zip path relative to lxpack project", () => {
    const project = {
      root: "/proj",
      schemaVersion: 1 as const,
      name: "demo",
      course: {
        courseId: "demo",
        title: "Demo",
        layout: "single-spa" as const,
        lessons: [{ id: "l1", title: "L1" }],
      },
      paths: {
        spaDistDir: "dist",
        lxpackOutDir: ".lxpack/course",
        outputBaseDir: ".lxpack/out",
      },
    };
    const { output, dir, outputBaseDir } = resolvePackageOutput(project, "scorm12");
    expect(output).toBe(".lxpack/out/course-scorm12.zip");
    expect(outputBaseDir).toBe(".lxpack/out");
    expect(dir).toBe(false);
  });

  it("uses custom outputBaseDir from project paths", () => {
    const project = {
      root: "/proj",
      schemaVersion: 1 as const,
      name: "demo",
      course: {
        courseId: "demo",
        title: "Demo",
        layout: "single-spa" as const,
        lessons: [{ id: "l1", title: "L1" }],
      },
      paths: {
        spaDistDir: "dist",
        lxpackOutDir: ".lxpack/course",
        outputBaseDir: "build/artifacts",
      },
    };
    const { output } = resolvePackageOutput(project, "scorm12");
    expect(output).toBe("build/artifacts/course-scorm12.zip");
  });

  it("resolves --out override under project root", () => {
    const project = {
      root: "/proj",
      schemaVersion: 1 as const,
      name: "demo",
      course: {
        courseId: "demo",
        title: "Demo",
        layout: "single-spa" as const,
        lessons: [{ id: "l1", title: "L1" }],
      },
      paths: {
        spaDistDir: "dist",
        lxpackOutDir: ".lxpack/course",
        outputBaseDir: ".lxpack/out",
      },
    };
    const { output } = resolvePackageOutput(project, "scorm12", "artifacts/course.zip");
    expect(output).toBe("/proj/artifacts/course.zip");
  });

  it("rejects --out path traversal", () => {
    const project = {
      root: "/proj",
      schemaVersion: 1 as const,
      name: "demo",
      course: {
        courseId: "demo",
        title: "Demo",
        layout: "single-spa" as const,
        lessons: [{ id: "l1", title: "L1" }],
      },
      paths: {
        spaDistDir: "dist",
        lxpackOutDir: ".lxpack/course",
        outputBaseDir: ".lxpack/out",
      },
    };
    expect(() => resolvePackageOutput(project, "scorm12", "../evil.zip")).toThrow(/unsafe/);
  });

  it("resolves standalone directory", () => {
    const project = {
      root: "/proj",
      schemaVersion: 1 as const,
      name: "demo",
      course: {
        courseId: "demo",
        title: "Demo",
        layout: "single-spa" as const,
        lessons: [{ id: "l1", title: "L1" }],
      },
      paths: {
        spaDistDir: "dist",
        lxpackOutDir: ".lxpack/course",
        outputBaseDir: ".lxpack/out",
      },
    };
    const { output, dir } = resolvePackageOutput(project, "standalone");
    expect(output).toBe(".lxpack/out/standalone");
    expect(dir).toBe(true);
  });

  it("treats standalone --out override ending in .zip as a file target", () => {
    const project = {
      root: "/proj",
      schemaVersion: 1 as const,
      name: "demo",
      course: {
        courseId: "demo",
        title: "Demo",
        layout: "single-spa" as const,
        lessons: [{ id: "l1", title: "L1" }],
      },
      paths: {
        spaDistDir: "dist",
        lxpackOutDir: ".lxpack/course",
        outputBaseDir: ".lxpack/out",
      },
    };
    const { output, dir } = resolvePackageOutput(project, "standalone", "artifacts/course.zip");
    expect(output).toBe("/proj/artifacts/course.zip");
    expect(dir).toBe(false);
  });
});

describe("loadLessonkitJson", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "lk-cli-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("loads and validates lessonkit.json", async () => {
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: 1 as const,
        name: "demo",
        course: {
          courseId: "demo",
          title: "Demo",
          layout: "single-spa",
          lessons: [{ id: "lesson-1", title: "Lesson" }],
        },
      }),
      "utf8",
    );

    const project = await loadLessonkitJson(dir);
    expect(project.name).toBe("demo");
    expect(project.course.courseId).toBe("demo");
  });

  it("rejects per-lesson-spa layout for CLI packaging", async () => {
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: 1 as const,
        name: "demo",
        course: {
          courseId: "demo",
          title: "Demo",
          layout: "per-lesson-spa",
          lessons: [{ id: "lesson-1", title: "Lesson", spaPath: "dist/lesson-1" }],
        },
      }),
      "utf8",
    );
    await expect(loadLessonkitJson(dir)).rejects.toMatchObject({
      exitCode: EXIT_INVALID_PROJECT,
      message: expect.stringContaining("per-lesson-spa"),
    });
  });

  it("rejects unsafe paths in lessonkit.json", async () => {
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: 1 as const,
        name: "demo",
        course: {
          courseId: "demo",
          title: "Demo",
          layout: "single-spa",
          lessons: [{ id: "lesson-1", title: "Lesson" }],
        },
        paths: { spaDistDir: "../../outside" },
      }),
      "utf8",
    );
    await expect(loadLessonkitJson(dir)).rejects.toMatchObject({
      exitCode: EXIT_INVALID_PROJECT,
      message: expect.stringContaining("invalid paths"),
    });
  });

  it("rejects non-array course.lessons", async () => {
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: 1 as const,
        name: "demo",
        course: {
          courseId: "demo",
          title: "Demo",
          layout: "single-spa",
          lessons: "not-an-array",
        },
      }),
      "utf8",
    );
    await expect(loadLessonkitJson(dir)).rejects.toMatchObject({
      exitCode: EXIT_INVALID_PROJECT,
      message: expect.stringContaining("course.lessons"),
    });
  });

  it("rejects invalid paths.spaDistDir type", async () => {
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: 1 as const,
        name: "demo",
        course: {
          courseId: "demo",
          title: "Demo",
          layout: "single-spa",
          lessons: [{ id: "lesson-1", title: "Lesson" }],
        },
        paths: { spaDistDir: 123 },
      }),
      "utf8",
    );
    await expect(loadLessonkitJson(dir)).rejects.toMatchObject({
      exitCode: EXIT_INVALID_PROJECT,
      message: expect.stringContaining("paths.spaDistDir"),
    });
  });

  it("rejects course.spaDistDir that differs from paths.spaDistDir", async () => {
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: 1 as const,
        name: "demo",
        course: {
          courseId: "demo",
          title: "Demo",
          layout: "single-spa",
          spaDistDir: "build/spa",
          lessons: [{ id: "lesson-1", title: "Lesson" }],
        },
        paths: { spaDistDir: "dist" },
      }),
      "utf8",
    );
    await expect(loadLessonkitJson(dir)).rejects.toMatchObject({
      exitCode: EXIT_INVALID_PROJECT,
      message: expect.stringContaining("course.spaDistDir"),
    });
  });

  it("rejects invalid schemaVersion", async () => {
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({ schemaVersion: 2, name: "demo", course: {} }),
      "utf8",
    );
    await expect(loadLessonkitJson(dir)).rejects.toMatchObject({ exitCode: EXIT_INVALID_PROJECT });
  });
});

describe("findProjectRoot", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "lk-cli-root-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("walks up to find lessonkit.json", async () => {
    const nested = join(dir, "apps", "course");
    await mkdir(nested, { recursive: true });
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: 1 as const,
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

    expect(findProjectRoot(nested)).toBe(dir);
  });

  it("accepts lessonkit.json with string schemaVersion", async () => {
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: "1",
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

    expect(findProjectRoot(dir)).toBe(dir);
  });

  it("skips lxpack interchange lessonkit.json without schemaVersion", async () => {
    const nested = join(dir, ".lxpack", "course");
    await mkdir(nested, { recursive: true });
    await writeFile(
      join(nested, "lessonkit.json"),
      JSON.stringify({ format: "lessonkit", version: "1", course: { id: "x", title: "X" } }),
      "utf8",
    );
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: 1 as const,
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

    expect(findProjectRoot(nested)).toBe(dir);
  });

  it("skips lessonkit.json when course is an array", async () => {
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: 1 as const,
        name: "bad",
        course: [{ courseId: "not-valid" }],
      }),
      "utf8",
    );

    expect(() => findProjectRoot(dir)).toThrow(/Could not find lessonkit\.json/);
  });
});

describe("runInit", () => {
  let parentDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    parentDir = await mkdtemp(join(tmpdir(), "lk-cli-init-"));
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(parentDir, { recursive: true, force: true });
  });

  it("scaffolds a project with --skip-install", async () => {
    const log = vi.fn();
    process.chdir(parentDir);
    process.exitCode = 0;

    await run(["node", "lessonkit", "init", "my-demo", "--skip-install"], { log, error: () => {} });

    const projectDir = join(parentDir, "my-demo");
    const pkg = JSON.parse(await readFile(join(projectDir, "package.json"), "utf8"));
    const lessonkit = JSON.parse(await readFile(join(projectDir, "lessonkit.json"), "utf8"));

    expect(pkg.name).toBe("my-demo");
    expect(lessonkit.name).toBe("my-demo");
    expect(lessonkit.course.courseId).toBe("my-demo");
    const appSource = await readFile(join(projectDir, "src/App.tsx"), "utf8");
    expect(appSource).toContain("@lessonkit/react");
    expect(appSource).toContain('courseId="my-demo"');
    expect(appSource).toContain('title="my-demo"');
    expect(appSource).toContain('preset={COURSE_THEME_PRESET}');
    const courseConfigSource = await readFile(join(projectDir, "src/courseConfig.ts"), "utf8");
    expect(courseConfigSource).toContain('courseId: "my-demo"');
    expect(lessonkit.course.tracking?.xapi?.activityIri).toBe("https://example.com/courses/my-demo");
  });

  it("slugifies numeric project names to valid courseId values", async () => {
    const log = vi.fn();
    process.chdir(parentDir);
    process.exitCode = 0;

    await run(["node", "lessonkit", "init", "9th-grade", "--skip-install"], { log, error: () => {} });

    const projectDir = join(parentDir, "id-9th-grade");
    const lessonkit = JSON.parse(await readFile(join(projectDir, "lessonkit.json"), "utf8"));
    expect(lessonkit.course.courseId).toBe("id-9th-grade");
    const appSource = await readFile(join(projectDir, "src/App.tsx"), "utf8");
    expect(appSource).toContain('courseId="id-9th-grade"');
  });

  it("initializes with --here when the directory contains only dotfiles", async () => {
    const here = join(parentDir, "git-only");
    await mkdir(here, { recursive: true });
    await mkdir(join(here, ".git"), { recursive: true });
    process.chdir(here);

    await runInit({ here: true, skipInstall: true }, { log: () => {}, error: () => {} });

    expect(existsSync(join(here, "package.json"))).toBe(true);
  });

  it("rolls back --here project files when promote fails", async () => {
    const here = join(parentDir, "promote-fail");
    await mkdir(here, { recursive: true });
    await writeFile(join(here, ".gitkeep"), "", "utf8");
    process.chdir(here);

    const promoteSpy = vi
      .spyOn(__testInitHelpers, "promoteStagingToProjectDir")
      .mockRejectedValueOnce(new Error("simulated promote failure"));

    await expect(
      runInit({ here: true, skipInstall: true }, { log: () => {}, error: () => {} }),
    ).rejects.toThrow("simulated promote failure");

    expect(existsSync(join(here, "package.json"))).toBe(false);
    expect(existsSync(join(here, ".gitkeep"))).toBe(true);
    promoteSpy.mockRestore();
  });

  it("rejects --force without --here", async () => {
    await expect(
      runInit(
        { name: "my-course", force: true, skipInstall: true },
        { log: () => {}, error: () => {} },
      ),
    ).rejects.toMatchObject({
      exitCode: EXIT_INVALID_PROJECT,
      message: expect.stringContaining("--force requires --here"),
    });
  });

  it("rejects --here --force when the directory has non-dotfile entries", async () => {
    const here = join(parentDir, "existing");
    await mkdir(here, { recursive: true });
    await writeFile(join(here, "stray.txt"), "keep", "utf8");
    process.chdir(here);

    await expect(
      runInit({ here: true, force: true, skipInstall: true }, { log: () => {}, error: () => {} }),
    ).rejects.toMatchObject({
      exitCode: EXIT_INVALID_PROJECT,
      message: expect.stringContaining("dotfiles only"),
    });
  });

  it("rolls back staging when dependency install fails", async () => {
    process.chdir(parentDir);
    const runNpmInstallSpy = vi
      .spyOn(await import("../src/lib/exec.js"), "runNpmInstall")
      .mockRejectedValueOnce(new Error("simulated install failure"));

    await expect(
      runInit({ name: "rollback-demo" }, { log: () => {}, error: () => {} }),
    ).rejects.toThrow("simulated install failure");

    expect(existsSync(join(parentDir, "rollback-demo"))).toBe(false);
    const entries = await readdir(parentDir);
    expect(entries.some((name) => name.startsWith(".rollback-demo-init-"))).toBe(false);
    runNpmInstallSpy.mockRestore();
  });
});

describe("resolveViteBuildArgs", () => {
  const baseProject = {
    root: "/proj",
    schemaVersion: 1 as const,
    name: "demo",
    course: {
      courseId: "demo",
      title: "Demo",
      layout: "single-spa" as const,
      lessons: [{ id: "l1", title: "L1" }],
    },
    paths: {
      spaDistDir: "dist",
      lxpackOutDir: ".lxpack/course",
      outputBaseDir: ".lxpack/out",
    },
  };

  it("omits --outDir for default dist", () => {
    expect(resolveViteBuildArgs(baseProject)).toEqual(["build"]);
  });

  it("passes --outDir when spaDistDir is customized", () => {
    expect(
      resolveViteBuildArgs({
        ...baseProject,
        paths: { ...baseProject.paths, spaDistDir: "build/spa" },
      }),
    ).toEqual(["build", "--outDir", "build/spa"]);
  });
});

describe("stripOutDirFromViteArgs", () => {
  it("removes --outDir and its value from passthrough args", () => {
    expect(stripOutDirFromViteArgs(["--outDir", "other", "--minify"])).toEqual(["--minify"]);
    expect(stripOutDirFromViteArgs(["--outDir=other", "--minify"])).toEqual(["--minify"]);
    expect(stripOutDirFromViteArgs(["-o", "other"])).toEqual([]);
  });
});

describe("resolveViteBuildArgv", () => {
  const baseProject = {
    root: "/proj",
    schemaVersion: 1 as const,
    name: "demo",
    course: {
      courseId: "demo",
      title: "Demo",
      layout: "single-spa" as const,
      lessons: [{ id: "l1", title: "L1" }],
    },
    paths: {
      spaDistDir: "build/spa",
      lxpackOutDir: ".lxpack/course",
      outputBaseDir: ".lxpack/out",
    },
  };

  it("appends configured --outDir after passthrough args", () => {
    expect(resolveViteBuildArgv(baseProject, ["--outDir", "ignored", "--minify"])).toEqual([
      "build",
      "--minify",
      "--outDir",
      "build/spa",
    ]);
  });

  it("always canonicalizes default dist outDir over passthrough", () => {
    const defaultDistProject = {
      ...baseProject,
      paths: { ...baseProject.paths, spaDistDir: "dist" },
    };
    expect(resolveViteBuildArgv(defaultDistProject, ["--outDir", "other", "--minify"])).toEqual([
      "build",
      "--minify",
      "--outDir",
      "dist",
    ]);
  });
});

describe("runBuild", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "lk-cli-build-"));
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: 1 as const,
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
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({ devDependencies: { vite: "^7.0.0" } }),
      "utf8",
    );
    await mkdir(join(dir, "node_modules", "vite", "bin"), { recursive: true });
    await writeFile(join(dir, "node_modules", "vite", "bin", "vite.js"), "", "utf8");
    process.chdir(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("invokes vite build", async () => {
    const runCommand = vi.spyOn(exec, "runCommand").mockResolvedValue(undefined);
    process.exitCode = 0;

    await run(["node", "lessonkit", "build", "--json"], { log: () => {}, error: () => {} });

    expect(runCommand).toHaveBeenCalledWith(
      process.execPath,
      expect.arrayContaining([
        expect.stringContaining("node_modules/vite/bin/vite.js"),
        "build",
      ]),
      expect.objectContaining({ cwd: expect.stringMatching(/lk-cli-build/) }),
    );
  });

  it("fails when build does not produce index.html", async () => {
    vi.spyOn(exec, "runCommand").mockResolvedValue(undefined);
    const { runBuild } = await import("../src/commands/dev.js");
    await expect(runBuild({ cwd: dir, json: true })).rejects.toMatchObject({
      message: expect.stringContaining("index.html"),
    });
  });

  it("verifies index.html after a successful build", async () => {
    vi.spyOn(exec, "runCommand").mockResolvedValue(undefined);
    await mkdir(join(dir, "dist"), { recursive: true });
    await writeFile(join(dir, "dist", "index.html"), "<html></html>", "utf8");
    const { runBuild } = await import("../src/commands/dev.js");
    const result = await runBuild({ cwd: dir, json: true });
    expect(result.ok).toBe(true);
  });
});
