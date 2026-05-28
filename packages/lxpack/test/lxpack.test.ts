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
  lessons: [
    { id: "phishing-101", title: "Phishing Awareness" },
    { id: "quiz-101", title: "Quiz" },
  ],
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
    expect(mapped.lessonIds).toEqual(["phishing-101", "quiz-101"]);
    expect(mapped.checkIds).toEqual(["email-first-step"]);
  });
});

describe("interchange", () => {
  it("single-spa emits one spa lesson at dist", () => {
    const lessons = resolveSpaLessons(baseDescriptor);
    expect(lessons).toEqual([
      { id: "phishing-101", title: "Phishing Awareness", path: "dist" },
    ]);
    const custom = resolveSpaLessons({ ...baseDescriptor, spaLessonId: "quiz-101" });
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
    }
  }, 30_000);
});
