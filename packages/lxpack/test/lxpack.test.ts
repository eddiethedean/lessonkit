import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  assessmentDescriptorToLxpack,
  descriptorToInterchange,
  extractAssessments,
  mapLessonkitIds,
  packageLessonkitCourse,
  resolveSpaLessons,
  themeToLxpackRuntime,
  validateDescriptor,
  writeLxpackProject,
} from "../src/index";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "lessonkit-lxpack-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

const baseDescriptor = {
  courseId: "cyber-basics",
  title: "Cybersecurity Basics",
  layout: "single-spa" as const,
  lessons: [{ id: "phishing-101", title: "Phishing Awareness" }],
  assessments: [
    {
      checkId: "email-first-step",
      question: "What should you do first?",
      choices: ["Open attachment", "Verify sender"],
      answer: "Verify sender",
      passingScore: 1,
    },
  ],
  theme: { preset: "default" as const },
  tracking: { completion: { threshold: 1 } },
};

describe("validateDescriptor", () => {
  it("rejects duplicate lesson ids", () => {
    const result = validateDescriptor({
      ...baseDescriptor,
      lessons: [
        { id: "dup", title: "A" },
        { id: "dup", title: "B" },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects duplicate checkId", () => {
    const assessment = baseDescriptor.assessments![0]!;
    const result = validateDescriptor({
      ...baseDescriptor,
      assessments: [assessment, { ...assessment }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.message.includes("duplicate checkId"))).toBe(true);
    }
  });

  it("rejects single-spa with multiple lesson rows", () => {
    const result = validateDescriptor({
      ...baseDescriptor,
      lessons: [
        { id: "a", title: "A" },
        { id: "b", title: "B" },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("requires layout", () => {
    const { layout: _layout, ...rest } = baseDescriptor;
    const result = validateDescriptor(rest as typeof baseDescriptor);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "layout")).toBe(true);
    }
  });

  it("rejects unknown layout", () => {
    const result = validateDescriptor({
      ...baseDescriptor,
      layout: "multi-spa" as "single-spa",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects unknown theme preset", () => {
    const result = validateDescriptor({
      ...baseDescriptor,
      theme: { preset: "neon" as "default" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "theme.preset")).toBe(true);
    }
  });

  it("requires spaPath for per-lesson-spa", () => {
    const result = validateDescriptor({
      ...baseDescriptor,
      layout: "per-lesson-spa",
      lessons: [{ id: "a", title: "A" }],
    });
    expect(result.ok).toBe(false);
  });
});

describe("mapLessonkitIds", () => {
  it("preserves lesson and check ids", () => {
    const mapped = mapLessonkitIds(baseDescriptor);
    expect(mapped.courseId).toBe("cyber-basics");
    expect(mapped.lessonIds).toEqual(["phishing-101"]);
    expect(mapped.checkIds).toEqual(["email-first-step"]);
  });
});

describe("interchange", () => {
  it("single-spa emits one spa lesson at dist", () => {
    const lessons = resolveSpaLessons(baseDescriptor);
    expect(lessons).toEqual([
      { id: "phishing-101", title: "Phishing Awareness", path: "dist" },
    ]);
    const multiLessonDescriptor = {
      ...baseDescriptor,
      lessons: [
        { id: "phishing-101", title: "Phishing Awareness" },
        { id: "quiz-101", title: "Quiz" },
      ],
    };
    const custom = resolveSpaLessons({ ...multiLessonDescriptor, spaLessonId: "quiz-101" });
    expect(custom[0]?.id).toBe("quiz-101");
    const interchange = descriptorToInterchange(baseDescriptor);
    expect(interchange.format).toBe("lessonkit");
    expect(interchange.lessons).toHaveLength(1);
  });

  it("per-lesson-spa emits one entry per lesson", () => {
    const descriptor = {
      ...baseDescriptor,
      layout: "per-lesson-spa" as const,
      lessons: [
        { id: "a", title: "A", spaPath: "dist/lessons/a" },
        { id: "b", title: "B", spaPath: "dist/lessons/b" },
      ],
    };
    const lessons = resolveSpaLessons(descriptor);
    expect(lessons).toHaveLength(2);
    expect(lessons[0]?.path).toBe("dist/lessons/a");
  });
});

describe("assessments", () => {
  it("maps checkId to lxpack assessment", () => {
    const lx = assessmentDescriptorToLxpack(baseDescriptor.assessments![0]!);
    expect(lx.id).toBe("email-first-step");
    expect(lx.questions[0]?.choices.some((c) => c.correct)).toBe(true);
    expect(extractAssessments(baseDescriptor)).toHaveLength(1);
  });

  it("assigns distinct choice ids when labels slug to the same value", () => {
    const lx = assessmentDescriptorToLxpack({
      checkId: "collision-check",
      question: "Pick one",
      choices: ["Yes", "YES"],
      answer: "Yes",
    });
    const ids = lx.questions[0]?.choices.map((c) => c.id) ?? [];
    expect(new Set(ids).size).toBe(2);
  });
});

describe("themeToLxpackRuntime", () => {
  it("exports css variables", () => {
    const runtime = themeToLxpackRuntime({ preset: "default" });
    expect(runtime.theme).toBe("default");
    expect(runtime.cssVariables["--lk-color-primary"]).toBeTruthy();
    const brand = themeToLxpackRuntime({ preset: "brand" });
    expect(brand.theme).toBe("brand");
  });
});

describe("writeLxpackProject", () => {
  it("writes course.yaml, lessonkit.json, and copies dist", async () => {
    const root = await makeTempDir();
    const dist = join(root, "vite-dist");
    await mkdir(dist, { recursive: true });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");

    const outDir = join(root, "lxpack-project");
    const result = await writeLxpackProject({
      descriptor: baseDescriptor,
      outDir,
      spaDistDir: dist,
    });

    const yaml = await readFile(result.courseYamlPath, "utf-8");
    expect(yaml).toContain("type: spa");
    expect(yaml).toContain("--lk-color-primary");
    const interchange = JSON.parse(await readFile(result.lessonkitJsonPath, "utf-8"));
    expect(interchange.course.id).toBe("cyber-basics");
    const index = await readFile(join(outDir, "dist", "index.html"), "utf-8");
    expect(index).toContain("html");
  });

  it("throws when per-lesson-spa is missing lessonSpaDirs entry", async () => {
    const root = await makeTempDir();
    await expect(
      writeLxpackProject({
        descriptor: {
          ...baseDescriptor,
          layout: "per-lesson-spa",
          lessons: [{ id: "a", title: "A", spaPath: "dist/a" }],
          assessments: [],
        },
        outDir: join(root, "out"),
        lessonSpaDirs: {},
      }),
    ).rejects.toThrow(/missing build output/);
  });

  it("per-lesson-spa copies each lesson folder", async () => {
    const root = await makeTempDir();
    const lessonA = join(root, "build-a");
    const lessonB = join(root, "build-b");
    await mkdir(lessonA, { recursive: true });
    await mkdir(lessonB, { recursive: true });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(join(lessonA, "index.html"), "a", "utf-8");
    await writeFile(join(lessonB, "index.html"), "b", "utf-8");

    const outDir = join(root, "lxpack-multi");
    await writeLxpackProject({
      descriptor: {
        ...baseDescriptor,
        layout: "per-lesson-spa",
        lessons: [
          { id: "a", title: "A", spaPath: "dist/lessons/a" },
          { id: "b", title: "B", spaPath: "dist/lessons/b" },
        ],
        assessments: [],
      },
      outDir,
      lessonSpaDirs: { a: lessonA, b: lessonB },
    });

    expect(await readFile(join(outDir, "dist/lessons/a/index.html"), "utf-8")).toBe("a");
    expect(await readFile(join(outDir, "dist/lessons/b/index.html"), "utf-8")).toBe("b");
  });
});

describe("writeLxpackProject errors", () => {
  it("throws when descriptor is invalid", async () => {
    const root = await makeTempDir();
    await expect(
      writeLxpackProject({
        descriptor: { ...baseDescriptor, courseId: "" } as typeof baseDescriptor,
        outDir: join(root, "out"),
        spaDistDir: join(root, "dist"),
      }),
    ).rejects.toThrow(/courseId/);
  });

  it("throws when spaDistDir is missing", async () => {
    const root = await makeTempDir();
    await expect(
      writeLxpackProject({
        descriptor: baseDescriptor,
        outDir: join(root, "out"),
        spaDistDir: join(root, "missing-dist"),
      }),
    ).rejects.toThrow(/spaDistDir not found/);
  });
});

describe("validateDescriptor edge cases", () => {
  it("rejects empty title and mismatched answer", () => {
    expect(validateDescriptor({ ...baseDescriptor, title: "  " }).ok).toBe(false);
    expect(
      validateDescriptor({
        ...baseDescriptor,
        assessments: [{ ...baseDescriptor.assessments![0]!, answer: "wrong" }],
      }).ok,
    ).toBe(false);
  });

  it("normalizes trimmed ids and titles on success", () => {
    const result = validateDescriptor({
      ...baseDescriptor,
      courseId: " cyber-basics ",
      title: "  Cyber  ",
      lessons: [{ id: " phishing-101 ", title: "  Phish  " }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.descriptor.courseId).toBe("cyber-basics");
      expect(result.descriptor.title).toBe("Cyber");
      expect(result.descriptor.lessons[0]?.id).toBe("phishing-101");
      expect(result.descriptor.lessons[0]?.title).toBe("Phish");
    }
  });

  it("rejects unsafe spaPath for per-lesson-spa", () => {
    const result = validateDescriptor({
      ...baseDescriptor,
      layout: "per-lesson-spa",
      lessons: [{ id: "a", title: "A", spaPath: "../escape" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("spaPath"))).toBe(true);
    }
  });

  it("rejects invalid spaLessonId for single-spa", () => {
    const result = validateDescriptor({
      ...baseDescriptor,
      spaLessonId: "missing-lesson",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "spaLessonId")).toBe(true);
    }
  });

  it("rejects duplicate spaPath", () => {
    const result = validateDescriptor({
      ...baseDescriptor,
      layout: "per-lesson-spa",
      lessons: [
        { id: "a", title: "A", spaPath: "dist/shared" },
        { id: "b", title: "B", spaPath: "dist/shared" },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("accepts passingScore as absolute points (not capped by choice count)", () => {
    const result = validateDescriptor({
      ...baseDescriptor,
      assessments: [
        {
          checkId: "multi-point",
          question: "Select all that apply",
          choices: ["A", "B", "C", "D"],
          answer: "A",
          passingScore: 2,
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.descriptor.assessments?.[0]?.passingScore).toBe(2);
    }
  });
});

describe("writeLxpackProject with assessments", () => {
  it("writes assessment yaml and course.yaml entries", async () => {
    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(join(dist, "index.html"), "ok", "utf-8");

    const outDir = join(root, "with-assessments");
    await writeLxpackProject({
      descriptor: baseDescriptor,
      outDir,
      spaDistDir: dist,
    });

    const courseYaml = await readFile(join(outDir, "course.yaml"), "utf-8");
    expect(courseYaml).toContain("assessments:");
    expect(courseYaml).toContain("email-first-step");
    const assessmentYaml = await readFile(
      join(outDir, "assessments/email-first-step.yaml"),
      "utf-8",
    );
    expect(assessmentYaml).toContain("passingScore:");
  });
});

describe("packageLessonkitCourse", () => {
  it("builds scorm12 zip from descriptor", async () => {
    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(join(dist, "index.html"), "<!DOCTYPE html><html><body>ok</body></html>", "utf-8");

    const outDir = join(root, "course");
    const result = await packageLessonkitCourse({
      descriptor: { ...baseDescriptor, assessments: [] },
      outDir,
      spaDistDir: dist,
      target: "scorm12",
      output: ".lxpack/out/course-scorm12.zip",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fileCount).toBeGreaterThan(0);
      expect(result.outputPath).toContain("course-scorm12.zip");
      expect(result.outputPath).toBe(
        "outputPath" in result.build ? result.build.outputPath : undefined,
      );
      expect(result.outputPath?.startsWith(outDir)).toBe(true);
    }
  }, 30_000);

  it("builds standalone directory from descriptor", async () => {
    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(join(dist, "index.html"), "<!DOCTYPE html><html><body>ok</body></html>", "utf-8");

    const outDir = join(root, "course");
    const result = await packageLessonkitCourse({
      descriptor: { ...baseDescriptor, assessments: [] },
      outDir,
      spaDistDir: dist,
      target: "standalone",
      output: ".lxpack/out/standalone",
      dir: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.outputDir).toContain("standalone");
      expect(result.fileCount).toBeGreaterThan(0);
    }
  }, 30_000);
});
