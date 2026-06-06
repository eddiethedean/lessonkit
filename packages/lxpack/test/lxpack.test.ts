import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
  validateDescriptorForTarget,
  writeLxpackProject,
} from "../src/index";
import { writeMinimalParitySource } from "./helpers/writeMinimalParitySource";

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
  it("rejects unknown assessment kinds", () => {
    const result = validateDescriptor({
      ...baseDescriptor,
      assessments: [{ kind: "fillInBlank", checkId: "bad-1", question: "Q?", template: "a *b*" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("kind"))).toBe(true);
    }
  });

  it("accepts trueFalse and fillInBlanks assessment kinds", () => {
    const tf = validateDescriptor({
      ...baseDescriptor,
      assessments: [{ kind: "trueFalse", checkId: "tf-1", question: "Agree?", answer: "true" }],
    });
    expect(tf.ok).toBe(true);

    const fib = validateDescriptor({
      ...baseDescriptor,
      assessments: [
        {
          kind: "fillInBlanks",
          checkId: "fib-1",
          question: "Fill",
          template: "Type *here*",
          blanks: [
            null,
            { id: "b1", answer: "here" },
            { answer: "missing-id" },
          ],
        },
      ],
    });
    expect(fib.ok).toBe(true);

    const falseTf = validateDescriptor({
      ...baseDescriptor,
      assessments: [{ kind: "trueFalse", checkId: "tf-f", question: "No?", answer: false }],
    });
    expect(falseTf.ok).toBe(true);
  });

  it("accepts findHotspot and findMultipleHotspots assessment kinds", () => {
    const findOne = validateDescriptor({
      ...baseDescriptor,
      assessments: [
        {
          kind: "findHotspot",
          checkId: "hs-1",
          question: "Find the hazard",
          src: "/map.png",
          alt: "Map",
          targets: [{ id: "t1", label: "Fire exit", x: 10, y: 20 }],
          correctTargetId: "t1",
        },
      ],
    });
    expect(findOne.ok).toBe(true);

    const findMany = validateDescriptor({
      ...baseDescriptor,
      assessments: [
        {
          kind: "findMultipleHotspots",
          checkId: "hs-m",
          question: "Mark hazards",
          src: "/floor.png",
          alt: "Floor plan",
          targets: [
            { id: "a", label: "A", x: 1, y: 2 },
            { id: "b", label: "B", x: 3, y: 4 },
          ],
          correctTargetIds: ["a", "b"],
        },
      ],
    });
    expect(findMany.ok).toBe(true);

    const invalidHotspot = validateDescriptor({
      ...baseDescriptor,
      assessments: [
        {
          kind: "findHotspot",
          checkId: "hs-bad",
          question: "Find",
        },
      ],
    });
    expect(invalidHotspot.ok).toBe(false);
  });

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
    expect(interchange.runtime?.cssVariables?.["--lk-color-primary"]).toBeDefined();
    expect(interchange.assessments?.[0]?.id).toBe("email-first-step");
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
    expect(lx).not.toBeNull();
    expect(lx!.id).toBe("email-first-step");
    expect(lx!.questions[0]?.choices.some((c) => c.correct)).toBe(true);
    expect(extractAssessments(baseDescriptor)).toHaveLength(1);
  });

  it("extractAssessments skips kinds that do not package to shell quizzes", () => {
    const injected = extractAssessments({
      ...baseDescriptor,
      assessments: [
        baseDescriptor.assessments![0]!,
        {
          kind: "fillInBlanks",
          checkId: "fib-only",
          question: "Fill",
          template: "Type *x*",
          blanks: [{ id: "b1", answer: "x" }],
        },
      ],
    });
    expect(injected).toHaveLength(1);
    expect(injected[0]?.id).toBe("email-first-step");
  });

  it("converts trueFalse descriptors to two-choice MCQ", () => {
    const lxTrue = assessmentDescriptorToLxpack({
      kind: "trueFalse",
      checkId: "tf-check",
      question: "Agree?",
      answer: true,
    });
    expect(lxTrue).not.toBeNull();
    expect(lxTrue!.questions[0]?.choices).toHaveLength(2);
    expect(lxTrue!.questions[0]?.choices.find((c) => c.correct)?.text).toBe("True");

    const lxFalse = assessmentDescriptorToLxpack({
      kind: "trueFalse",
      checkId: "tf-false",
      question: "Agree?",
      answer: false,
    });
    expect(lxFalse!.questions[0]?.choices.find((c) => c.correct)?.text).toBe("False");
  });

  it("returns null for descriptors without MCQ fields", () => {
    expect(
      assessmentDescriptorToLxpack({
        checkId: "orphan",
        question: "Q",
      } as Parameters<typeof assessmentDescriptorToLxpack>[0]),
    ).toBeNull();
  });

  it("returns null for fillInBlanks (SPA scoring only)", () => {
    expect(
      assessmentDescriptorToLxpack({
        kind: "fillInBlanks",
        checkId: "fib-check",
        question: "Fill in",
        template: "Answer *here*",
        blanks: [{ id: "b1", answer: "answer" }],
      }),
    ).toBeNull();
  });

  it("assigns distinct choice ids when labels slug to the same value", () => {
    const lx = assessmentDescriptorToLxpack({
      checkId: "collision-check",
      question: "Pick one",
      choices: ["Yes", "YES"],
      answer: "Yes",
    });
    expect(lx).not.toBeNull();
    const ids = lx!.questions[0]?.choices.map((c) => c.id) ?? [];
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
  it("rejects outDir outside projectRoot when projectRoot is set", async () => {
    const root = await makeTempDir();
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");

    await expect(
      writeLxpackProject({
        descriptor: baseDescriptor,
        outDir: join(root, "..", "outside"),
        spaDistDir: dist,
        projectRoot: root,
      }),
    ).rejects.toThrow(/unsafe path escapes project root/);
  });

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
  it("rejects mcq assessments missing choices", () => {
    const result = validateDescriptor({
      ...baseDescriptor,
      assessments: [{ checkId: "q1", question: "Pick one", answer: "A" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.endsWith(".choices"))).toBe(true);
    }
  });

  it("rejects empty title and mismatched answer", () => {
    expect(validateDescriptor({ ...baseDescriptor, title: "  " }).ok).toBe(false);
    expect(
      validateDescriptor({
        ...baseDescriptor,
        assessments: [{ ...baseDescriptor.assessments![0]!, answer: "wrong" }],
      }).ok,
    ).toBe(false);
  });

  it("rejects invalid assessment fields", () => {
    const bad = validateDescriptor({
      ...baseDescriptor,
      assessments: [
        {
          checkId: "bad id!",
          question: "  ",
          choices: ["  "],
          answer: "missing",
        },
      ],
    });
    expect(bad.ok).toBe(false);

    const passing = validateDescriptor({
      ...baseDescriptor,
      assessments: [{ ...baseDescriptor.assessments![0]!, passingScore: 0 }],
    });
    expect(passing.ok).toBe(false);
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

  it("rejects passingScore above achievable score for mcq", () => {
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
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("passingScore"))).toBe(true);
    }
  });

  it("validateDescriptorForTarget rejects non-injectable assessments for LMS targets", () => {
    const descriptor = {
      ...baseDescriptor,
      assessments: [
        {
          kind: "fillInBlanks" as const,
          checkId: "fib-pack",
          question: "Fill",
          template: "Type *here*",
        },
      ],
    };
    expect(validateDescriptor(descriptor).ok).toBe(true);
    const packaged = validateDescriptorForTarget(descriptor, "scorm12");
    expect(packaged.ok).toBe(false);
    if (!packaged.ok) {
      expect(packaged.issues[0]?.message).toContain("not injected into LMS shell quizzes");
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

    const packDescriptor = { ...baseDescriptor, assessments: [] as typeof baseDescriptor.assessments };
    await writeMinimalParitySource(root, packDescriptor);

    const outDir = join(root, "course");
    const result = await packageLessonkitCourse({
      descriptor: packDescriptor,
      outDir,
      spaDistDir: dist,
      projectRoot: root,
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

    const packDescriptor = { ...baseDescriptor, assessments: [] as typeof baseDescriptor.assessments };
    await writeMinimalParitySource(root, packDescriptor);

    const outDir = join(root, "course");
    const result = await packageLessonkitCourse({
      descriptor: packDescriptor,
      outDir,
      spaDistDir: dist,
      projectRoot: root,
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
