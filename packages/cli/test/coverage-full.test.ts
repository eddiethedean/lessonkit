import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir, readFile, symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { run } from "../src/index.js";
import { runInit, __testInitHelpers } from "../src/commands/init.js";
import { runPackage } from "../src/commands/package.js";
import { runBuild } from "../src/commands/dev.js";
import {
  formatCliError,
  CliError,
  EXIT_INVALID_PROJECT,
  EXIT_PACKAGING,
} from "../src/lib/errors.js";
import {
  findProjectRoot,
  loadLessonkitJson,
  readPackageJson,
  assertViteProject,
  resolveViteBin,
  assertNode18ForLxpack,
} from "../src/lib/project.js";
import { parsePackageTarget, resolvePackageOutput, isLxpackTarget } from "../src/lib/paths.js";
import { runNpmInstall, runCommand } from "../src/lib/exec.js";
import { createLogger } from "../src/lib/logger.js";
import * as paths from "../src/lib/paths.js";
import * as exec from "../src/lib/exec.js";
import * as lxpack from "@lessonkit/lxpack";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

const mockedSpawn = vi.mocked(spawn);

describe("coverage-full CLI", () => {
  describe("createLogger", () => {
    it("no-ops log and error when json mode is enabled", () => {
      const logger = createLogger({ json: true });
      expect(() => logger.log("hidden")).not.toThrow();
      expect(() => logger.error("hidden")).not.toThrow();
    });
  });

  describe("isLxpackTarget", () => {
    it("classifies LMS vs react-vite targets", () => {
      expect(isLxpackTarget("scorm12")).toBe(true);
      expect(isLxpackTarget("react-vite")).toBe(false);
    });
  });

  describe("formatCliError", () => {
    it("formats non-Error values as RUNTIME", () => {
      expect(formatCliError("boom").message).toBe("boom");
      expect(formatCliError(null).message).toBe("null");
      expect(formatCliError(new Error("runtime")).message).toBe("runtime");
    });

    it("formats CliError without issues", () => {
      const formatted = formatCliError(
        new CliError("plain", { code: "INVALID_PROJECT", exitCode: 2 }),
      );
      expect(formatted.message).toBe("plain");
      expect(formatted.json.ok).toBe(false);
    });

    it("formats CliError issues without paths", () => {
      const formatted = formatCliError(
        new CliError("bad", {
          code: "PACKAGING",
          exitCode: EXIT_PACKAGING,
          issues: [{ message: "detail only" }],
        }),
      );
      expect(formatted.message).toContain("detail only");
    });
  });

  describe("parsePackageTarget / runPackage", () => {
    it("throws TARGET_REQUIRED when target is missing", async () => {
      await expect(runPackage({})).rejects.toMatchObject({
        code: "TARGET_REQUIRED",
        exitCode: EXIT_INVALID_PROJECT,
      });
    });

    it("maps non-Error parse failures to INVALID_PROJECT", async () => {
      vi.spyOn(paths, "parsePackageTarget").mockImplementation(() => {
        throw "bad-target";
      });
      await expect(runPackage({ target: "scorm12" })).rejects.toMatchObject({
        code: "INVALID_PROJECT",
        message: "bad-target",
      });
      vi.restoreAllMocks();
    });

    it("rejects unknown targets", () => {
      expect(() => parsePackageTarget("nope")).toThrow(/Unknown target/);
    });

    it("resolvePackageOutput maps non-Error override failures", () => {
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
      const overrideSpy = vi
        .spyOn(lxpack, "resolveSafePackageOutputOverride")
        .mockImplementation(() => {
          throw "unsafe";
        });
      expect(() => resolvePackageOutput(project, "scorm12", "out.zip")).toThrow(CliError);
      overrideSpy.mockRestore();
    });
  });

  describe("createProgram / run", () => {
    let parentDir: string;
    let originalCwd: string;
    const log = vi.fn();
    const error = vi.fn();

    beforeEach(async () => {
      originalCwd = process.cwd();
      parentDir = await mkdtemp(join(tmpdir(), "lk-cli-cov-"));
      log.mockClear();
      error.mockClear();
      process.exitCode = 0;
    });

    afterEach(async () => {
      process.chdir(originalCwd);
      await rm(parentDir, { recursive: true, force: true });
      vi.restoreAllMocks();
    });

    it("does not log package success lines when --json is set", async () => {
      const stdout = vi.spyOn(console, "log").mockImplementation(() => {});
      const dir = join(parentDir, "pkg-json");
      await mkdir(join(dir, "dist"), { recursive: true });
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
      await writeFile(join(dir, "dist", "index.html"), "ok", "utf8");
      process.chdir(dir);
      await run(["node", "lessonkit", "package", "--target", "react-vite", "--no-build", "--json"]);
      expect(stdout.mock.calls.some((c) => String(c[0]).includes("Built react-vite"))).toBe(false);
      stdout.mockRestore();
    });

    it("emits JSON on successful init", async () => {
      const stdout = vi.spyOn(console, "log").mockImplementation(() => {});
      process.chdir(parentDir);
      await run(["node", "lessonkit", "init", "json-demo", "--skip-install", "--json"]);
      expect(stdout).toHaveBeenCalledWith(
        expect.stringContaining('"ok":true'),
      );
      stdout.mockRestore();
    });

    it("emits JSON on command failure", async () => {
      const stdout = vi.spyOn(console, "log").mockImplementation(() => {});
      process.chdir(parentDir);
      await run(["node", "lessonkit", "init", "--json"]);
      expect(stdout).toHaveBeenCalledWith(
        expect.stringMatching(/"ok":false/),
      );
      expect(process.exitCode).toBe(EXIT_INVALID_PROJECT);
      stdout.mockRestore();
    });

    it("logs errors to console when not using --json", async () => {
      const stderr = vi.spyOn(console, "error").mockImplementation(() => {});
      process.chdir(parentDir);
      await run(["node", "lessonkit", "init"], { log, error });
      expect(stderr).toHaveBeenCalledWith(expect.stringContaining("Project name is required"));
      expect(process.exitCode).toBe(EXIT_INVALID_PROJECT);
      stderr.mockRestore();
    });

    it("forwards excess vite args to dev", async () => {
      const dir = join(parentDir, "dev-proj");
      await mkdir(dir, { recursive: true });
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
      await mkdir(join(dir, "node_modules", "vite", "bin"), { recursive: true });
      await writeFile(join(dir, "node_modules", "vite", "bin", "vite.js"), "", "utf8");

      const runCommandSpy = vi.spyOn(exec, "runCommand").mockResolvedValue(undefined);
      process.chdir(dir);
      await run(["node", "lessonkit", "dev", "--", "--port", "5174"], { log, error });

      const viteArgs = runCommandSpy.mock.calls[0]?.[1] ?? [];
      expect(viteArgs).toContain("--port");
      expect(viteArgs).toContain("5174");
    });

    it("logs react-vite package success without --json", async () => {
      const stdout = vi.spyOn(console, "log").mockImplementation(() => {});
      const dir = join(parentDir, "pkg-rv");
      await mkdir(join(dir, "dist"), { recursive: true });
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
      await mkdir(join(dir, "node_modules", "vite", "bin"), { recursive: true });
      await writeFile(join(dir, "node_modules", "vite", "bin", "vite.js"), "", "utf8");
      await writeFile(join(dir, "dist", "index.html"), "ok", "utf8");

      vi.spyOn(exec, "runCommand").mockResolvedValue(undefined);
      process.chdir(dir);
      await run(["node", "lessonkit", "package", "--target", "react-vite", "--no-build"], { log, error });

      expect(stdout).toHaveBeenCalledWith(expect.stringContaining("Built react-vite"));
      stdout.mockRestore();
    });

    it("logs LMS package success without --json", async () => {
      const stdout = vi.spyOn(console, "log").mockImplementation(() => {});
      const pkgSpy = vi.spyOn(lxpack, "packageLessonkitCourse").mockResolvedValue({
        ok: true,
        courseDir: "/c",
        target: "scorm12",
        outputPath: "/c/out.zip",
        fileCount: 2,
        validation: { ok: true, issues: [], manifest: {} as never },
        build: { ok: true, issues: [], fileCount: 2, target: "scorm12", manifest: {} as never },
      });

      const dir = join(parentDir, "pkg-lms");
      await mkdir(join(dir, "dist"), { recursive: true });
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
      await writeFile(join(dir, "dist", "index.html"), "ok", "utf8");
      Object.defineProperty(process.versions, "node", { value: "20.0.0", configurable: true });

      process.chdir(dir);
      await run(["node", "lessonkit", "package", "--target", "scorm12", "--no-build"], { log, error });

      expect(stdout).toHaveBeenCalledWith(expect.stringMatching(/Packaged scorm12/));
      stdout.mockRestore();
      pkgSpy.mockRestore();
    });

    it("logs LMS package without destination when paths are absent", async () => {
      const stdout = vi.spyOn(console, "log").mockImplementation(() => {});
      const pkgSpy = vi.spyOn(lxpack, "packageLessonkitCourse").mockResolvedValue({
        ok: true,
        courseDir: "/c",
        target: "scorm12",
        fileCount: 0,
        validation: { ok: true, issues: [], manifest: {} as never },
        build: { ok: true, issues: [], fileCount: 0, target: "scorm12", manifest: {} as never },
      });

      const dir = join(parentDir, "pkg-nodeest");
      await mkdir(join(dir, "dist"), { recursive: true });
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
      await writeFile(join(dir, "dist", "index.html"), "ok", "utf8");
      Object.defineProperty(process.versions, "node", { value: "20.0.0", configurable: true });

      process.chdir(dir);
      await run(["node", "lessonkit", "package", "--target", "scorm12", "--no-build"], { log, error });

      expect(stdout).toHaveBeenCalledWith("Packaged scorm12 (0 files)");
      stdout.mockRestore();
      pkgSpy.mockRestore();
    });

    it("logs standalone package using outputDir when outputPath is absent", async () => {
      const stdout = vi.spyOn(console, "log").mockImplementation(() => {});
      const pkgSpy = vi.spyOn(lxpack, "packageLessonkitCourse").mockResolvedValue({
        ok: true,
        courseDir: "/c",
        target: "standalone",
        outputDir: "/c/standalone",
        fileCount: 1,
        validation: { ok: true, issues: [], manifest: {} as never },
        build: { ok: true, issues: [], fileCount: 1, target: "standalone", manifest: {} as never },
      });

      const dir = join(parentDir, "pkg-standalone");
      await mkdir(join(dir, "dist"), { recursive: true });
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
      await writeFile(join(dir, "dist", "index.html"), "ok", "utf8");
      Object.defineProperty(process.versions, "node", { value: "20.0.0", configurable: true });

      process.chdir(dir);
      await run(["node", "lessonkit", "package", "--target", "standalone", "--no-build"], { log, error });

      expect(stdout).toHaveBeenCalledWith(expect.stringMatching(/Packaged standalone/));
      stdout.mockRestore();
      pkgSpy.mockRestore();
    });

    it("publish stub uses base logger", async () => {
      const baseLog = vi.fn();
      await run(["node", "lessonkit", "publish"], { log: baseLog, error: () => {} });
      expect(baseLog).toHaveBeenCalledWith(expect.stringContaining("not implemented"));
    });
  });

  describe("__testInitHelpers", () => {
    it("covers template and directory helper edge cases", async () => {
      expect(__testInitHelpers.getTemplateDir()).toContain("template/vite-react");
      expect(await __testInitHelpers.isDirEmpty(join(tmpdir(), "lk-nonexistent-empty-dir"))).toBe(
        true,
      );
      expect(
        await __testInitHelpers.isDirEmptyOrDotfilesOnly(
          join(tmpdir(), "lk-nonexistent-dotfiles-dir"),
        ),
      ).toBe(true);
      const escaped = __testInitHelpers.escapeJsxString('a\\b"c{d}e<f>\r\nx');
      expect(escaped).toContain("\\\\");
      expect(escaped).toContain('\\"');
      expect(escaped).toContain("\\u003c");
      expect(escaped).toContain("\\n");
      expect(__testInitHelpers.escapeJsxString("line\rbreak")).toBe("line\\nbreak");
      expect(__testInitHelpers.escapeJsxString("line\nbreak")).toBe("line\\nbreak");
    });

    it("copyTemplate skips non-file, non-directory entries", async () => {
      const root = await mkdtemp(join(tmpdir(), "lk-copy-template-"));
      try {
        const src = join(root, "src");
        const dest = join(root, "dest");
        await mkdir(src);
        await writeFile(join(src, "file.txt"), "ok", "utf8");
        await symlink(join(src, "file.txt"), join(src, "link.txt"));
        await __testInitHelpers.copyTemplate(src, dest);
        expect(await readFile(join(dest, "file.txt"), "utf8")).toBe("ok");
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });

  });

  describe("runInit edge cases", () => {
    let parentDir: string;
    let originalCwd: string;

    beforeEach(async () => {
      originalCwd = process.cwd();
      parentDir = await mkdtemp(join(tmpdir(), "lk-cli-init-cov-"));
    });

    afterEach(async () => {
      process.chdir(originalCwd);
      await rm(parentDir, { recursive: true, force: true });
      vi.restoreAllMocks();
    });

    it("requires a project name when not using --here", async () => {
      process.chdir(parentDir);
      await expect(
        runInit({ skipInstall: true }, { log: () => {}, error: () => {} }),
      ).rejects.toMatchObject({ exitCode: EXIT_INVALID_PROJECT });
    });

    it("rejects creating a project when the directory already exists", async () => {
      const existing = join(parentDir, "exists");
      await mkdir(existing, { recursive: true });
      process.chdir(parentDir);
      await expect(
        runInit({ name: "exists", skipInstall: true }, { log: () => {}, error: () => {} }),
      ).rejects.toMatchObject({ message: expect.stringContaining("already exists") });
    });

    it("rejects --here when the directory is not empty", async () => {
      const here = join(parentDir, "busy");
      await mkdir(here, { recursive: true });
      await writeFile(join(here, "file.txt"), "x", "utf8");
      process.chdir(here);
      await expect(
        runInit({ here: true, skipInstall: true }, { log: () => {}, error: () => {} }),
      ).rejects.toMatchObject({ message: expect.stringContaining("not empty") });
    });

    it("initializes --here --force when only dotfiles are present", async () => {
      const here = join(parentDir, "dot-only");
      await mkdir(here, { recursive: true });
      await writeFile(join(here, ".gitkeep"), "", "utf8");
      process.chdir(here);
      const result = await runInit(
        { here: true, force: true, skipInstall: true },
        { log: () => {}, error: () => {} },
      );
      expect(result.ok).toBe(true);
      const { existsSync } = await import("node:fs");
      expect(existsSync(join(here, "lessonkit.json"))).toBe(true);
    });

    it("escapes special characters in project titles for App.tsx", async () => {
      process.chdir(parentDir);
      await runInit(
        { name: 'angle<brace{}\nline', skipInstall: true },
        { log: () => {}, error: () => {} },
      );
      const slug = "angle-brace-line";
      const appSource = await readFile(join(parentDir, slug, "src", "App.tsx"), "utf8");
      expect(appSource).not.toContain("{{courseTitle}}");
      expect(appSource).toContain("\\u003c");
      expect(appSource).toContain("angle\\u003cbrace");
    });

    it("runs npm install when skipInstall is false", async () => {
      const install = vi.spyOn(exec, "runNpmInstall").mockResolvedValue(undefined);
      const logSpy = vi.fn();
      process.chdir(parentDir);
      await runInit(
        { name: "with-install", skipInstall: false },
        { log: logSpy, error: () => {} },
      );
      expect(install).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Installing dependencies"));
    });

    it("logs the slug in next steps for named projects", async () => {
      process.chdir(parentDir);
      const logSpy = vi.fn();
      await runInit({ name: "named-proj", skipInstall: true }, { log: logSpy, error: () => {} });
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("cd named-proj && lessonkit dev"));
    });

    it("init --here in an empty directory succeeds without --force", async () => {
      const here = join(parentDir, "empty-here");
      await mkdir(here, { recursive: true });
      process.chdir(here);
      const result = await runInit({ here: true, skipInstall: true }, { log: () => {}, error: () => {} });
      expect(result.ok).toBe(true);
    });

    it("init --here derives the slug from the current directory name", async () => {
      const here = join(parentDir, "My Course!");
      await mkdir(here, { recursive: true });
      process.chdir(here);
      const logSpy = vi.fn();
      const result = await runInit(
        { here: true, skipInstall: true },
        { log: logSpy, error: () => {} },
      );
      expect(result.ok).toBe(true);
      const lessonkit = JSON.parse(await readFile(join(here, "lessonkit.json"), "utf8"));
      expect(lessonkit.course.courseId).toMatch(/^my-course/);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("cd . && lessonkit dev"));
    });

    it("skips install status logs when --json is set", async () => {
      vi.spyOn(exec, "runNpmInstall").mockResolvedValue(undefined);
      process.chdir(parentDir);
      const logSpy = vi.fn();
      await runInit(
        { name: "json-install", skipInstall: false, json: true },
        { log: logSpy, error: () => {} },
      );
      expect(logSpy).not.toHaveBeenCalled();
    });

    it("escapes backslashes, braces, and newlines in project titles", async () => {
      process.chdir(parentDir);
      const result = await runInit(
        { name: "slash\\brace{}\\n\\rtitle", skipInstall: true },
        { log: () => {}, error: () => {} },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected init success");
      const appSource = await readFile(join(result.projectRoot, "src", "App.tsx"), "utf8");
      expect(appSource).toContain("\\\\");
      expect(appSource).toContain("\\{");
      expect(appSource).toContain("\\n");
    });

    it("escapes carriage returns in project titles", async () => {
      process.chdir(parentDir);
      const result = await runInit(
        { name: "line\rbreak", skipInstall: true },
        { log: () => {}, error: () => {} },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected init success");
      const appSource = await readFile(join(result.projectRoot, "src", "App.tsx"), "utf8");
      expect(appSource).toContain("\\n");
    });

    it("throws when the bundled template is missing", async () => {
      vi.resetModules();
      vi.doMock("node:fs", async (importOriginal) => {
        const actual = await importOriginal<typeof import("node:fs")>();
        return {
          ...actual,
          existsSync: (path: Parameters<typeof actual.existsSync>[0]) => {
            if (String(path).includes("template/vite-react")) return false;
            return actual.existsSync(path);
          },
        };
      });
      const { runInit: runInitFresh } = await import("../src/commands/init.js");
      process.chdir(parentDir);
      await expect(
        runInitFresh({ name: "no-template", skipInstall: true }, { log: () => {}, error: () => {} }),
      ).rejects.toMatchObject({ message: expect.stringContaining("Bundled template not found") });
      vi.doUnmock("node:fs");
      vi.resetModules();
    });
  });

  describe("project helpers", () => {
    let dir: string;

    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), "lk-cli-proj-cov-"));
    });

    afterEach(async () => {
      await rm(dir, { recursive: true, force: true });
    });

    it("loadLessonkitJson fails when lessonkit.json is unreadable", async () => {
      await expect(loadLessonkitJson(dir)).rejects.toMatchObject({
        exitCode: EXIT_INVALID_PROJECT,
        message: expect.stringContaining("Failed to read"),
      });
    });

    it("throws generic manifest error for unrecognized issues", async () => {
      await writeFile(
        join(dir, "lessonkit.json"),
        JSON.stringify({
          schemaVersion: 1,
          name: "",
          course: {
            courseId: "demo",
            title: "Demo",
            layout: "single-spa",
            lessons: [{ id: "l1", title: "L1" }],
          },
        }),
        "utf8",
      );
      await expect(loadLessonkitJson(dir)).rejects.toMatchObject({
        message: expect.stringContaining("invalid lessonkit manifest"),
      });
    });

    it("readPackageJson fails when package.json is missing", async () => {
      await expect(readPackageJson(dir)).rejects.toMatchObject({
        message: expect.stringContaining("package.json"),
      });
    });

    it("assertViteProject throws when vite is missing", () => {
      expect(() => assertViteProject({}, dir)).toThrow(/No Vite dependency/);
    });

    it("assertViteProject accepts vite via node_modules/.bin/vite", async () => {
      await mkdir(join(dir, "node_modules", ".bin"), { recursive: true });
      await writeFile(join(dir, "node_modules", ".bin", "vite"), "", "utf8");
      expect(() => assertViteProject({}, dir)).not.toThrow();
    });

    it("resolveViteBin delegates to resolveViteJs", async () => {
      const viteJs = join(dir, "node_modules", "vite", "bin", "vite.js");
      await mkdir(join(dir, "node_modules", "vite", "bin"), { recursive: true });
      await writeFile(viteJs, "", "utf8");
      expect(resolveViteBin(dir)).toBe(viteJs);
    });

    it("skips invalid JSON lessonkit.json while walking parents", async () => {
      await writeFile(join(dir, "lessonkit.json"), "{ not json", "utf8");
      expect(() => findProjectRoot(dir)).toThrow(/Could not find/);
    });

    it("assertNode18ForLxpack rejects Node 16", () => {
      const original = process.versions.node;
      Object.defineProperty(process.versions, "node", { value: "16.0.0", configurable: true });
      expect(() => assertNode18ForLxpack()).toThrow(/Node.js 18/);
      Object.defineProperty(process.versions, "node", { value: original, configurable: true });
    });
  });

  describe("runPackage dist guards", () => {
    let dir: string;

    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), "lk-cli-pkg-dist-"));
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
      await mkdir(join(dir, "node_modules", "vite", "bin"), { recursive: true });
      await writeFile(join(dir, "node_modules", "vite", "bin", "vite.js"), "", "utf8");
      Object.defineProperty(process.versions, "node", { value: "20.0.0", configurable: true });
    });

    afterEach(async () => {
      await rm(dir, { recursive: true, force: true });
      vi.restoreAllMocks();
    });

    it("react-vite fails when dist is missing after build", async () => {
      vi.spyOn(exec, "runCommand").mockResolvedValue(undefined);
      await expect(runPackage({ target: "react-vite", cwd: dir })).rejects.toMatchObject({
        message: expect.stringContaining("dist directory not found"),
      });
    });

    it("LMS target fails when dist is missing after build", async () => {
      vi.spyOn(exec, "runCommand").mockResolvedValue(undefined);
      await expect(runPackage({ target: "scorm12", cwd: dir })).rejects.toMatchObject({
        message: expect.stringContaining("Run lessonkit build first"),
      });
    });
  });

  describe("exec", () => {
    it("runNpmInstall invokes npm install", async () => {
      const child = new EventEmitter() as EventEmitter & { on: EventEmitter["on"] };
      mockedSpawn.mockReturnValue(child as never);
      const promise = runNpmInstall("/tmp/proj");
      child.emit("close", 0);
      await expect(promise).resolves.toBeUndefined();
      expect(mockedSpawn).toHaveBeenCalledWith("npm", ["install"], expect.any(Object));
    });

    it("rejects when child exits with null code", async () => {
      const child = new EventEmitter() as EventEmitter & { on: EventEmitter["on"] };
      mockedSpawn.mockReturnValue(child as never);
      const promise = runCommand("cmd", [], { cwd: "/tmp" });
      child.emit("close", null);
      await expect(promise).rejects.toMatchObject({ message: /unknown/ });
    });
  });

  describe("runBuild with custom spaDistDir", () => {
    let dir: string;

    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), "lk-cli-build-out-"));
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
          paths: { spaDistDir: "build/spa" },
        }),
        "utf8",
      );
      await writeFile(join(dir, "package.json"), JSON.stringify({ devDependencies: { vite: "^7" } }), "utf8");
      await mkdir(join(dir, "node_modules", "vite", "bin"), { recursive: true });
      await writeFile(join(dir, "node_modules", "vite", "bin", "vite.js"), "", "utf8");
    });

    afterEach(async () => {
      await rm(dir, { recursive: true, force: true });
      vi.restoreAllMocks();
    });

    it("passes --outDir to vite build", async () => {
      const runCommandSpy = vi.spyOn(exec, "runCommand").mockResolvedValue(undefined);
      await runBuild({ cwd: dir, json: true });
      expect(runCommandSpy).toHaveBeenCalledWith(
        process.execPath,
        expect.arrayContaining(["build", "--outDir", "build/spa"]),
        expect.objectContaining({ cwd: dir }),
      );
    });
  });
});
