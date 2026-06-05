import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import { getPresetTheme } from "@lessonkit/themes";
import {
  assessmentDescriptorToLxpack,
  buildStagingPackage,
  descriptorToInterchange,
  ensureOutDirParent,
  mapLessonkitIds,
  packageLessonkitCourse,
  parseLessonkitManifest,
  promoteStagingToOutDir,
  remapArtifactPaths,
  resolveSpaLessons,
  telemetryEventToLessonkit,
  themeToLxpackRuntime,
  validateDescriptor,
  validateDescriptorForTarget,
  validatePackageInputs,
  writeLxpackProject,
} from "../src/index";
import {
  assertRealPathUnderRoot,
  assertResolvedPathUnderRoot,
  isResolvedPathUnderRoot,
  isSafeRelativeSpaPath,
  relativePathUnderRoot,
  resolveComparablePath,
} from "../src/spaPath";
import { resolveSafePackageOutputOverride } from "../src/validateProjectPaths";

const { materializeLessonkitProject } = vi.hoisted(() => ({
  materializeLessonkitProject: vi.fn(),
}));

vi.mock("@lxpack/validators", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@lxpack/validators")>();
  return { ...actual, materializeLessonkitProject };
});

const tempDirs: string[] = [];

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

const baseDescriptor = {
  courseId: "cyber-basics",
  title: "Cybersecurity Basics",
  layout: "single-spa" as const,
  lessons: [{ id: "phishing-101", title: "Phishing Awareness" }],
  theme: { preset: "default" as const },
};

afterEach(async () => {
  vi.clearAllMocks();
  materializeLessonkitProject.mockReset();
  await Promise.all(tempDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

describe("coverage-full lxpack", () => {
  describe("parseLessonkitManifest", () => {
    it("rejects non-object roots and invalid nested shapes", () => {
      expect(parseLessonkitManifest(null).ok).toBe(false);
      expect(
        parseLessonkitManifest({
          schemaVersion: 1,
          name: 123,
          course: {
            courseId: "demo",
            title: "Demo",
            layout: "single-spa",
            lessons: [{ id: "l1", title: "L1" }],
          },
        }).ok,
      ).toBe(false);
      expect(parseLessonkitManifest({ schemaVersion: 2, name: "demo", course: {} }).ok).toBe(false);
      expect(
        parseLessonkitManifest({ schemaVersion: 1, name: "demo", course: null }).ok,
      ).toBe(false);
      expect(parseLessonkitManifest({ schemaVersion: 1, name: "  ", course: {} }).ok).toBe(false);
      expect(
        parseLessonkitManifest({
          schemaVersion: 1,
          name: "demo",
          course: {
            courseId: "d",
            title: "D",
            layout: "single-spa",
            lessons: "not-array",
          },
        }).ok,
      ).toBe(false);
      expect(
        parseLessonkitManifest({
          schemaVersion: 1,
          name: "demo",
          course: { courseId: "d", title: "D", layout: "single-spa", assessments: {} },
        }).ok,
      ).toBe(false);
      expect(
        parseLessonkitManifest({
          schemaVersion: 1,
          name: "demo",
          course: {
            courseId: "demo",
            title: "Demo",
            layout: "single-spa",
            lessons: [{ id: "l1", title: "L1" }],
          },
          paths: null,
        }).ok,
      ).toBe(false);
      expect(
        parseLessonkitManifest({
          schemaVersion: 1,
          name: "demo",
          course: {
            courseId: "demo",
            title: "Demo",
            layout: "single-spa",
            lessons: [{ id: "l1", title: "L1" }],
          },
          paths: { spaDistDir: "   " },
        }).ok,
      ).toBe(false);
    });
  });

  describe("validateDescriptor", () => {
    it("rejects non-object course input", () => {
      expect(validateDescriptor(null).ok).toBe(false);
    });

    it("rejects non-object lesson and assessment rows", () => {
      const lessons = validateDescriptor({
        courseId: "c",
        title: "T",
        layout: "single-spa",
        lessons: [null],
      });
      expect(lessons.ok).toBe(false);
      const assessments = validateDescriptor({
        ...baseDescriptor,
        assessments: [null],
      });
      expect(assessments.ok).toBe(false);
      const numericRows = validateDescriptor({
        courseId: "course-1",
        title: "T",
        layout: "single-spa",
        lessons: [1],
        assessments: [1],
      });
      expect(numericRows.ok).toBe(false);
    });

    it("rejects empty lessons array", () => {
      expect(validateDescriptor({ ...baseDescriptor, lessons: [] }).ok).toBe(false);
    });

    it("accepts validateDescriptorForTarget without a target", () => {
      expect(validateDescriptorForTarget(baseDescriptor).ok).toBe(true);
    });

    it("accepts spaLessonId that matches a lesson id", () => {
      const result = validateDescriptor({
        ...baseDescriptor,
        spaLessonId: "phishing-101",
      });
      expect(result.ok).toBe(true);
    });

    it("rejects spaLessonId that does not match a lesson", () => {
      const result = validateDescriptor({
        ...baseDescriptor,
        spaLessonId: "other-lesson",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues.some((i) => i.path === "spaLessonId")).toBe(true);
      }
    });

    it("rejects invalid completion threshold values", () => {
      expect(
        validateDescriptor({
          ...baseDescriptor,
          tracking: { completion: { threshold: Number.NaN } },
        }).ok,
      ).toBe(false);
      expect(
        validateDescriptor({
          ...baseDescriptor,
          tracking: { completion: { threshold: -0.1 } },
        }).ok,
      ).toBe(false);
    });

    it("rejects lessons with empty titles", () => {
      const result = validateDescriptor({
        ...baseDescriptor,
        lessons: [{ id: "lesson-1", title: "   " }],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues.some((i) => i.path.includes("title"))).toBe(true);
      }
    });

    it("rejects invalid completion threshold values", () => {
      expect(
        validateDescriptor({
          ...baseDescriptor,
          tracking: { completion: { threshold: Number.NaN } },
        }).ok,
      ).toBe(false);
      expect(
        validateDescriptor({
          ...baseDescriptor,
          tracking: { completion: { threshold: -0.1 } },
        }).ok,
      ).toBe(false);
    });

    it("rejects lessons with empty titles", () => {
      const result = validateDescriptor({
        ...baseDescriptor,
        lessons: [{ id: "lesson-1", title: "   " }],
      });
      expect(result.ok).toBe(false);
    });

    it("rejects duplicate assessment checkIds", () => {
      const assessment = {
        checkId: "check-1",
        question: "Q",
        choices: ["A"],
        answer: "A",
      };
      const result = validateDescriptor({
        ...baseDescriptor,
        assessments: [assessment, { ...assessment }],
      });
      expect(result.ok).toBe(false);
    });

    it("rejects invalid tracking threshold and theme payloads", () => {
      const threshold = validateDescriptor({
        ...baseDescriptor,
        tracking: { completion: { threshold: 2 } },
      });
      expect(threshold.ok).toBe(false);

      const theme = validateDescriptor({
        ...baseDescriptor,
        theme: { theme: { name: "bad", version: "not-semver", tokens: {} } },
      });
      expect(theme.ok).toBe(false);
    });

    it("parses tracking when nested fields are not objects", () => {
      expect(
        validateDescriptor({
          courseId: "course-1",
          title: "T",
          layout: "single-spa",
          lessons: [{ id: "lesson-1", title: "L1" }],
          tracking: { completion: "invalid", xapi: "invalid" },
        }).ok,
      ).toBe(true);
      expect(
        validateDescriptor({
          courseId: "course-1",
          title: "T",
          layout: "single-spa",
          lessons: [{ id: "lesson-1", title: "L1" }],
          theme: "invalid",
        }).ok,
      ).toBe(true);
    });

    it("parses tracking when completion is not an object", () => {
      const parsed = validateDescriptor({
        courseId: "course-1",
        title: "T",
        layout: "single-spa",
        lessons: [{ id: "lesson-1", title: "L1" }],
        tracking: { completion: "invalid" },
      });
      expect(parsed.ok).toBe(true);
    });

    it("accepts loosely typed optional descriptor fields from JSON", () => {
      const parsed = validateDescriptor({
        courseId: "course-1",
        title: "T",
        layout: "single-spa",
        lessons: [{ id: "lesson-1", title: "L1" }],
        version: 1,
        spaDistDir: 1,
        spaLessonId: 1,
        tracking: 1,
        theme: 1,
      });
      expect(parsed.ok).toBe(true);
    });

    it("parses loose tracking and theme fields on input", () => {
      const parsed = validateDescriptor({
        courseId: "course-1",
        title: "T",
        layout: "single-spa",
        lessons: [{ id: "lesson-1", title: "L1" }],
        tracking: { completion: "invalid", xapi: null },
        theme: { preset: "dark", theme: "invalid" },
      });
      expect(parsed.ok).toBe(true);
    });

    it("rejects single-spa layout with multiple lesson rows", () => {
      const result = validateDescriptor({
        ...baseDescriptor,
        lessons: [
          { id: "a", title: "A" },
          { id: "b", title: "B" },
        ],
      });
      expect(result.ok).toBe(false);
    });

    it("parses tracking and theme branches on loosely typed input", () => {
      const parsed = validateDescriptor({
        courseId: "course-1",
        title: "T",
        layout: "single-spa",
        lessons: [{ id: "lesson-1", title: "L1" }],
        tracking: { completion: { threshold: 0.5 }, xapi: { activityIri: "https://example.com" } },
        theme: { preset: "dark" },
        assessments: [{ checkId: "check-1", question: "Q", choices: ["A"], answer: "A" }],
      });
      expect(parsed.ok).toBe(true);
    });

    it("validateDescriptorForTarget requires activityIri for cmi5", () => {
      const missing = validateDescriptorForTarget(baseDescriptor, "cmi5");
      expect(missing.ok).toBe(false);
      const ok = validateDescriptorForTarget(
        {
          ...baseDescriptor,
          tracking: { xapi: { activityIri: "https://example.com/activity/1" } },
        },
        "cmi5",
      );
      expect(ok.ok).toBe(true);
      expect(validateDescriptorForTarget(baseDescriptor, undefined).ok).toBe(true);
      expect(validateDescriptorForTarget(baseDescriptor, "scorm12").ok).toBe(true);
    });

    it("rejects invalid lesson id rows from validateId", () => {
      const result = validateDescriptor({
        ...baseDescriptor,
        lessons: [{ id: "bad id!", title: "T" }],
      });
      expect(result.ok).toBe(false);
    });

    it("rejects answers that do not match any choice", () => {
      const result = validateDescriptor({
        ...baseDescriptor,
        assessments: [
          {
            checkId: "check-1",
            question: "Q",
            choices: ["A", "B"],
            answer: "C",
          },
        ],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues.some((i) => i.path.includes("answer"))).toBe(true);
      }
    });

    it("rejects duplicate lesson titles and invalid spaLessonId id format", () => {
      const noTitle = validateDescriptor({
        ...baseDescriptor,
        lessons: [{ id: "l1", title: "  " }],
      });
      expect(noTitle.ok).toBe(false);

      const badSpaId = validateDescriptor({
        ...baseDescriptor,
        spaLessonId: "bad id!",
      });
      expect(badSpaId.ok).toBe(false);
    });
  });

  describe("interchange and assessments", () => {
    it("returns undefined tracking when no fields are set", () => {
      const interchange = descriptorToInterchange({
        ...baseDescriptor,
        tracking: {},
        assessments: [],
      });
      expect(interchange.tracking).toBeUndefined();
    });

    it("maps tracking without xapi activityIri", () => {
      const interchange = descriptorToInterchange({
        ...baseDescriptor,
        tracking: { completion: { threshold: 0.5 } },
        assessments: [],
      });
      expect(interchange.tracking?.completion?.threshold).toBe(0.5);
      expect(interchange.tracking?.xapi).toBeUndefined();
    });

    it("includes xapi when activityIri is present", () => {
      const interchange = descriptorToInterchange({
        ...baseDescriptor,
        tracking: { xapi: { activityIri: "https://example.com/a" } },
        assessments: [],
      });
      expect(interchange.tracking?.xapi?.activityIri).toBe("https://example.com/a");
    });

    it("slugifies empty choice labels", () => {
      const lx = assessmentDescriptorToLxpack({
        checkId: "c1",
        question: "Q",
        choices: ["!!!"],
        answer: "!!!",
      });
      expect(lx).not.toBeNull();
      expect(lx!.questions[0]?.choices[0]?.id).toMatch(/^choice-1$/);
    });

    it("mapLessonkitIds handles courses without assessments", () => {
      const { checkIds } = mapLessonkitIds({ ...baseDescriptor, assessments: undefined });
      expect(checkIds).toEqual([]);
    });

    it("resolveSpaLessons uses default lesson id when none match", () => {
      const lessons = resolveSpaLessons({
        ...baseDescriptor,
        lessons: [],
        spaLessonId: undefined,
      });
      expect(lessons[0]?.id).toBe("main");
    });
  });

  describe("theme and telemetry", () => {
    it("uses explicit custom theme tokens", () => {
      const runtime = themeToLxpackRuntime({ theme: getPresetTheme("dark") });
      expect(runtime.theme).toBe("dark");
    });

    it("returns null telemetry for unsupported events and partial quiz payloads", () => {
      expect(
        telemetryEventToLessonkit({
          name: "lesson_time_on_task",
          courseId: "c",
          lessonId: "l",
          sessionId: "s",
          timestamp: new Date().toISOString(),
          data: { lessonId: "l" },
        } as TelemetryEvent),
      ).toBeNull();

      const answered = telemetryEventToLessonkit({
        name: "quiz_answered",
        courseId: "c",
        lessonId: "l",
        sessionId: "s",
        timestamp: new Date().toISOString(),
        data: { checkId: "q1" },
      } as TelemetryEvent);
      expect(answered?.assessmentId).toBe("q1");

      const completed = telemetryEventToLessonkit({
        name: "quiz_completed",
        courseId: "c",
        lessonId: "l",
        sessionId: "s",
        timestamp: new Date().toISOString(),
        data: { checkId: "q1", score: 1, maxScore: 1, passingScore: 1 },
      } as TelemetryEvent);
      expect(completed?.score).toBe(1);

      expect(
        telemetryEventToLessonkit({
          name: "interaction",
          courseId: "c",
          lessonId: "l",
          sessionId: "s",
          timestamp: new Date().toISOString(),
        } as TelemetryEvent),
      ).toMatchObject({ name: "interaction", lessonId: "l" });

      expect(
        telemetryEventToLessonkit({
          name: "quiz_completed",
          courseId: "c",
          lessonId: "l",
          sessionId: "s",
          timestamp: new Date().toISOString(),
          data: { notCheckId: true },
        } as unknown as TelemetryEvent),
      ).toMatchObject({ name: "quiz_completed", lessonId: "l" });
    });

    it("defaults preset when theme is omitted", () => {
      expect(themeToLxpackRuntime({}).theme).toBe("default");
    });
  });

  describe("resolveSpaDirs without projectRoot", () => {
    it("uses descriptor.spaDistDir when the option is omitted", async () => {
      const root = await makeTempDir("lk-spa-desc-only-");
      const dist = join(root, "build", "custom");
      await mkdir(dist, { recursive: true });
      await writeFile(join(dist, "index.html"), "<html></html>", "utf8");
      const prev = process.cwd();
      process.chdir(root);
      try {
        const { resolveSpaDirs } = await import("../src/spaDirs");
        const dirs = await resolveSpaDirs({
          descriptor: { ...baseDescriptor, spaDistDir: "build/custom" },
        });
        expect(dirs["phishing-101"]).toMatch(/build[\\/]custom$/);
      } finally {
        process.chdir(prev);
      }
    });

    it("prefers explicit spaDistDir over descriptor default", async () => {
      const root = await makeTempDir("lk-spa-explicit-");
      const dist = join(root, "dist");
      await mkdir(dist, { recursive: true });
      await writeFile(join(dist, "index.html"), "<html></html>", "utf8");
      const { resolveSpaDirs } = await import("../src/spaDirs");
      const dirs = await resolveSpaDirs({
        descriptor: { ...baseDescriptor, spaDistDir: "build/custom" },
        spaDistDir: "dist",
        projectRoot: root,
      });
      expect(dirs["phishing-101"]).toBe(dist);
    });

    it("uses descriptor.spaDistDir when option is omitted", async () => {
      const root = await makeTempDir("lk-spa-desc-");
      const dist = join(root, "custom-dist");
      await mkdir(dist, { recursive: true });
      await writeFile(join(dist, "index.html"), "<html></html>", "utf8");
      const { resolveSpaDirs } = await import("../src/spaDirs");
      const dirs = await resolveSpaDirs({
        descriptor: { ...baseDescriptor, spaDistDir: "custom-dist" },
        projectRoot: root,
      });
      expect(dirs["phishing-101"]).toMatch(/custom-dist$/);
    });

    it("resolves spaDistDir relative to cwd", async () => {
      const root = await makeTempDir("lk-spa-cwd-");
      const dist = join(root, "dist");
      await mkdir(dist, { recursive: true });
      await writeFile(join(dist, "index.html"), "<html></html>", "utf8");
      const prev = process.cwd();
      process.chdir(root);
      try {
        const { resolveSpaDirs } = await import("../src/spaDirs");
        const dirs = await resolveSpaDirs({
          descriptor: baseDescriptor,
          spaDistDir: "dist",
        });
        expect(dirs["phishing-101"]).toMatch(/\/dist$/);
      } finally {
        process.chdir(prev);
      }
    });
  });

  describe("spaPath and validateProjectPaths", () => {
    it("covers path comparison helpers", () => {
      expect(isSafeRelativeSpaPath("")).toBe(false);
      expect(isSafeRelativeSpaPath("\0bad")).toBe(false);
      expect(isSafeRelativeSpaPath("\\windows")).toBe(false);
      expect(resolveComparablePath("C:\\dist\\index.html")).toContain("C:");
      expect(() =>
        assertResolvedPathUnderRoot(
          resolveComparablePath("C:\\root"),
          resolveComparablePath("C:\\root\\nested"),
        ),
      ).not.toThrow();
      const root = resolveComparablePath("/tmp/root");
      const child = join(root, "nested");
      expect(relativePathUnderRoot(root, child)).toBe(`nested`);
      assertResolvedPathUnderRoot(root, child);
      expect(isResolvedPathUnderRoot(root, root)).toBe(true);
      assertRealPathUnderRoot(root, join(root, "planned", "dist"));
    });

    it("rejects empty output override", () => {
      expect(() => resolveSafePackageOutputOverride("/tmp", "   ")).toThrow(/non-empty/);
    });

    it("allows absolute overrides inside project root", async () => {
      const root = await makeTempDir("lk-abs-out-");
      const out = join(root, "artifacts", "out.zip");
      await mkdir(join(root, "artifacts"), { recursive: true });
      expect(resolveSafePackageOutputOverride(root, out)).toBe(out);
    });
  });

  describe("validatePackageInputs and remapArtifactPaths", () => {
    it("requires projectRoot", async () => {
      const root = await makeTempDir("lk-val-root-");
      const result = validatePackageInputs({
        target: "scorm12",
        outDir: join(root, "course"),
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues.some((i) => i.path === "projectRoot")).toBe(true);
      }
    });

    it("rejects unsafe output path under projectRoot", async () => {
      const root = await makeTempDir("lk-val-out-");
      const result = validatePackageInputs({
        target: "scorm12",
        outDir: join(root, "course"),
        projectRoot: root,
        output: "../../../evil.zip",
      });
      expect(result.ok).toBe(false);
    });

    it("accepts absolute output path confined under projectRoot", async () => {
      const root = await makeTempDir("lk-val-abs-out-");
      const output = join(root, "artifacts", "course-scorm12.zip");
      const result = validatePackageInputs({
        target: "scorm12",
        outDir: join(root, "course"),
        projectRoot: root,
        output,
      });
      expect(result.ok).toBe(true);
    });

    it("rejects outputBaseDir outside projectRoot", async () => {
      const root = await makeTempDir("lk-val-in-");
      const result = validatePackageInputs({
        target: "scorm12",
        outDir: join(root, "course"),
        projectRoot: root,
        outputBaseDir: "../../../outside",
      });
      expect(result.ok).toBe(false);
    });

    it("rejects outputBaseDir that resolves outside projectRoot via symlink", async () => {
      const root = await makeTempDir("lk-val-sym-");
      const outside = join(root, "..", "lk-outside-base");
      await mkdir(outside, { recursive: true });
      const linkDir = join(root, "linked-out");
      const { symlink } = await import("node:fs/promises");
      await symlink(outside, linkDir, "dir");
      const result = validatePackageInputs({
        target: "scorm12",
        outDir: join(root, "course"),
        projectRoot: root,
        outputBaseDir: "linked-out",
      });
      expect(result.ok).toBe(false);
      await rm(outside, { recursive: true, force: true });
    });

    it("remaps artifact at staging root to outDir", () => {
      const staging = resolveComparablePath("/tmp/staging");
      expect(remapArtifactPaths(staging, "/tmp/out", staging)).toBe("/tmp/out");
    });

    it("remaps nested artifacts under staging to posix outDir", () => {
      const staging = resolveComparablePath("/tmp/staging");
      const artifact = join(staging, "nested", "course.zip");
      expect(remapArtifactPaths(staging, "/tmp/out", artifact)).toBe(
        join("/tmp/out", "nested", "course.zip"),
      );
    });

    it("remaps with win32 outDir when drive letter is present", () => {
      const stagingRoot = "C:\\staging";
      const artifact = "C:\\staging\\course.zip";
      expect(remapArtifactPaths(stagingRoot, "C:\\out", artifact)).toBe("C:\\out\\course.zip");
    });

    it("throws when remap relative path escapes staging", () => {
      const staging = resolveComparablePath("/tmp/staging");
      const artifact = resolveComparablePath("/tmp/staging/../outside.zip");
      expect(() => remapArtifactPaths(staging, "/tmp/out", artifact)).toThrow(
        /outside the staging directory/,
      );
    });
  });

  describe("buildStagingPackage", () => {
    it("uses directory output defaults when dir is true", async () => {
      const root = await makeTempDir("lk-staging-dir-");
      const dist = join(root, "dist");
      await mkdir(dist, { recursive: true });
      await writeFile(join(dist, "index.html"), "<html></html>", "utf8");
      const result = await buildStagingPackage({
        descriptor: baseDescriptor,
        outDir: join(root, "out"),
        spaDistDir: dist,
        target: "standalone",
        dir: true,
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("buildStagingPackage spaDirs failure", () => {
    it("maps non-Error spaDirs failures to issues", async () => {
      const spaDirsMod = await import("../src/spaDirs");
      vi.spyOn(spaDirsMod, "resolveSpaDirs").mockRejectedValueOnce("spa failure");
      const result = await buildStagingPackage({
        descriptor: baseDescriptor,
        outDir: "/tmp/out",
        spaDistDir: "/tmp/dist",
        target: "scorm12",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues[0]?.message).toBe("spa failure");
      }
      vi.restoreAllMocks();
    });

    it("returns ok false when spa dist is missing", async () => {
      const result = await buildStagingPackage({
        descriptor: baseDescriptor,
        outDir: "/tmp/out",
        spaDistDir: "/tmp/missing-dist",
        target: "scorm12",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues[0]?.path).toBe("spaDirs");
      }
    });
  });

  describe("__testPromoteFs", () => {
    it("exercises pathExists and renameOrCopy", async () => {
      const { __testPromoteFs } = await import("../src/packaging/promote");
      const root = await makeTempDir("lk-promote-fs-");
      const src = join(root, "src.txt");
      const dest = join(root, "dest.txt");
      await writeFile(src, "data", "utf8");
      expect(await __testPromoteFs.pathExists(src)).toBe(true);
      expect(await __testPromoteFs.pathExists(join(root, "missing"))).toBe(false);
      await __testPromoteFs.renameOrCopy(src, dest);
      expect(await readFile(dest, "utf8")).toBe("data");
    });
  });

  describe("promoteStagingToOutDir", () => {
    it("promotes staging into a new outDir and replaces existing outDir", async () => {
      const root = await makeTempDir("lk-promote-ok-");
      const outDir = join(root, "course");
      const stagingDir = join(root, "staging");
      await mkdir(stagingDir, { recursive: true });
      await writeFile(join(stagingDir, "course.yaml"), "title: OK", "utf8");

      await promoteStagingToOutDir(stagingDir, outDir);
      expect(await readFile(join(outDir, "course.yaml"), "utf8")).toBe("title: OK");

      const staging2 = join(root, "staging2");
      await mkdir(staging2, { recursive: true });
      await writeFile(join(staging2, "course.yaml"), "title: v2", "utf8");
      await promoteStagingToOutDir(staging2, outDir);
      expect(await readFile(join(outDir, "course.yaml"), "utf8")).toBe("title: v2");
    });

  });

  describe("ensureOutDirParent", () => {
    it("creates parent directories", async () => {
      const root = await makeTempDir("lk-staging-parent-");
      const outDir = join(root, "nested", "course");
      await ensureOutDirParent(outDir);
      const { access } = await import("node:fs/promises");
      await expect(access(join(root, "nested"))).resolves.toBeUndefined();
    });
  });

  describe("writeLxpackProject", () => {
    it("throws when materializeLessonkitProject fails", async () => {
      materializeLessonkitProject.mockResolvedValueOnce({
        ok: false,
        issues: [{ message: "invalid interchange" }],
      });
      const root = await makeTempDir("lk-write-fail-");
      const dist = join(root, "dist");
      await mkdir(dist, { recursive: true });
      await writeFile(join(dist, "index.html"), "ok", "utf8");
      await expect(
        writeLxpackProject({ descriptor: baseDescriptor, outDir: join(root, "out"), spaDistDir: dist }),
      ).rejects.toThrow(/invalid interchange/);
    });
  });

  describe("packageLessonkitCourse", () => {
    it("surfaces non-Error promote failures", async () => {
      const promoteModule = await import("../src/packaging/promote");
      vi.spyOn(promoteModule, "promoteStagingToOutDir").mockRejectedValueOnce("promote broke");
      const root = await makeTempDir("lk-pkg-promote-");
      const dist = join(root, "dist");
      await mkdir(dist, { recursive: true });
      await writeFile(join(dist, "index.html"), "<!DOCTYPE html><html></html>", "utf8");
      const result = await packageLessonkitCourse({
        descriptor: { ...baseDescriptor, assessments: [] },
        outDir: join(root, "course"),
        spaDistDir: dist,
        projectRoot: root,
        target: "scorm12",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues[0]?.message).toContain("promote broke");
      }
    });

  });
});
