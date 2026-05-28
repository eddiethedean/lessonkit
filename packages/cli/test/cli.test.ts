import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createProgram, run } from "../src/index.js";
import { formatCliError, CliError, EXIT_INVALID_PROJECT } from "../src/lib/errors.js";
import { findProjectRoot, loadLessonkitJson } from "../src/lib/project.js";
import { parsePackageTarget, resolvePackageOutput, resolveViteBuildArgs } from "../src/lib/paths.js";
import * as exec from "../src/lib/exec.js";

describe("@lessonkit/cli program", () => {
  it("createProgram wires basic metadata", () => {
    const program = createProgram({ log: () => {}, error: () => {} });
    expect(program.name()).toBe("lessonkit");
    expect(program.description()).toBe("LessonKit CLI");
  });

  it("publish remains a stub", async () => {
    const log = vi.fn();
    await run(["node", "lessonkit", "publish"], { log, error: () => {} });
    expect(log).toHaveBeenCalledWith(
      "lessonkit publish is not implemented. See RELEASING.md for npm publish workflow.",
    );
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
      schemaVersion: 1,
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
      schemaVersion: 1,
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

  it("resolves standalone directory", () => {
    const project = {
      root: "/proj",
      schemaVersion: 1,
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
        schemaVersion: 1,
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
        schemaVersion: 1,
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

    expect(findProjectRoot(nested)).toBe(dir);
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

    expect(findProjectRoot(nested)).toBe(dir);
  });
});

describe("runInit", () => {
  let parentDir: string;

  beforeEach(async () => {
    parentDir = await mkdtemp(join(tmpdir(), "lk-cli-init-"));
  });

  afterEach(async () => {
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
    expect(appSource).toContain('preset="default"');
  });
});

describe("resolveViteBuildArgs", () => {
  const baseProject = {
    root: "/proj",
    schemaVersion: 1,
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

describe("runBuild", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "lk-cli-build-"));
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
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({ devDependencies: { vite: "^7.0.0" } }),
      "utf8",
    );
    await mkdir(join(dir, "node_modules", ".bin"), { recursive: true });
    await writeFile(join(dir, "node_modules", ".bin", "vite"), "", "utf8");
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
      expect.stringContaining("node_modules/.bin/vite"),
      ["build"],
      expect.objectContaining({ cwd: expect.stringMatching(/lk-cli-build/) }),
    );
  });
});
