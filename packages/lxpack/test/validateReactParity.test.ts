import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { validateReactManifestParity } from "../src/validateReactParity";
import type { LessonkitCourseDescriptor } from "../src/types";

function testDescriptor(
  overrides: Partial<LessonkitCourseDescriptor> & Pick<LessonkitCourseDescriptor, "courseId">,
): LessonkitCourseDescriptor {
  return {
    title: "T",
    layout: "single-spa",
    lessons: [],
    ...overrides,
  };
}

describe("validateReactManifestParity", () => {
  it("passes when courseId and checkIds appear in src", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(
      join(root, "src/App.tsx"),
      `<Course courseId="my-course"><Quiz checkId="quiz-1" /></Course>`,
    );

    const issues = validateReactManifestParity({
      projectRoot: root,
      descriptor: testDescriptor({
        courseId: "my-course",
        assessments: [{ checkId: "quiz-1", question: "Q", choices: ["a"], answer: "a" }],
      }),
    });

    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("errors when courseId missing from React source", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "src/App.tsx"), `<Course courseId="other"><Quiz checkId="q" /></Course>`);

    const issues = validateReactManifestParity({
      projectRoot: root,
      descriptor: testDescriptor({
        courseId: "my-course",
        assessments: [{ checkId: "q", question: "Q", choices: ["a"], answer: "a" }],
      }),
    });

    expect(issues.some((i) => i.path === "course.courseId" && i.severity === "error")).toBe(true);
  });

  it("rejects substring courseId false positive", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(
      join(root, "src/App.tsx"),
      `<Course courseId="my-course"><Quiz checkId="q" /></Course>`,
    );

    const issues = validateReactManifestParity({
      projectRoot: root,
      descriptor: testDescriptor({
        courseId: "course",
        assessments: [{ checkId: "q", question: "Q", choices: ["a"], answer: "a" }],
      }),
    });

    expect(issues.some((i) => i.path === "course.courseId" && i.severity === "error")).toBe(true);
  });

  it("rejects checkId only in comments", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(
      join(root, "src/App.tsx"),
      `<Course courseId="my-course">{/* checkId="quiz-a" */}<Quiz checkId="quiz-b" /></Course>`,
    );

    const issues = validateReactManifestParity({
      projectRoot: root,
      descriptor: testDescriptor({
        courseId: "my-course",
        assessments: [{ checkId: "quiz-a", question: "Q", choices: ["a"], answer: "a" }],
      }),
    });

    expect(issues.some((i) => i.path === "assessments.checkId:quiz-a" && i.severity === "error")).toBe(
      true,
    );
  });

  it("accepts courseId via string constant", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(
      join(root, "src/App.tsx"),
      `const COURSE_ID = "my-course";\nexport default () => <Course courseId={COURSE_ID} />;`,
    );

    const issues = validateReactManifestParity({
      projectRoot: root,
      descriptor: testDescriptor({
        courseId: "my-course",
        assessments: [],
      }),
    });

    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("accepts checkId via string constant", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(
      join(root, "src/App.tsx"),
      `const CHECK = "quiz-1";\nexport default () => <Course courseId="my-course"><Quiz checkId={CHECK} /></Course>;`,
    );

    const issues = validateReactManifestParity({
      projectRoot: root,
      descriptor: testDescriptor({
        courseId: "my-course",
        assessments: [{ checkId: "quiz-1", question: "Q", choices: ["a"], answer: "a" }],
      }),
    });

    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("rejects courseId only in object literal without JSX binding", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(
      join(root, "src/constants.ts"),
      `export const COURSE_ID = "my-course";\nexport const META = { courseId: COURSE_ID };`,
    );

    const issues = validateReactManifestParity({
      projectRoot: root,
      descriptor: testDescriptor({
        courseId: "my-course",
        assessments: [],
      }),
    });

    expect(issues.some((i) => i.path === "course.courseId" && i.severity === "error")).toBe(true);
  });

  it("accepts courseId in courseConfig.ts", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(
      join(root, "src/courseConfig.ts"),
      `export const courseConfig = { courseId: "my-course" };`,
    );
    writeFileSync(
      join(root, "src/App.tsx"),
      `<Lesson lessonId="l1" />`,
    );

    const issues = validateReactManifestParity({
      projectRoot: root,
      descriptor: testDescriptor({
        courseId: "my-course",
        lessons: [{ id: "l1", title: "L" }],
        assessments: [],
      }),
    });

    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("errors when lessonId missing from React source", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "src/App.tsx"), `<Course courseId="my-course" />`);

    const issues = validateReactManifestParity({
      projectRoot: root,
      descriptor: testDescriptor({
        courseId: "my-course",
        lessons: [{ id: "lesson-a", title: "A" }],
        assessments: [],
      }),
    });

    expect(issues.some((i) => i.path === "lessons.id:lesson-a" && i.severity === "error")).toBe(true);
  });

  it("accepts single-quoted checkId", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(
      join(root, "src/App.tsx"),
      `<Course courseId='my-course'><Quiz checkId='quiz-1' /></Course>`,
    );

    const issues = validateReactManifestParity({
      projectRoot: root,
      descriptor: testDescriptor({
        courseId: "my-course",
        assessments: [{ checkId: "quiz-1", question: "Q", choices: ["a"], answer: "a" }],
      }),
    });

    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("scans nested src/**/*.tsx files", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));
    mkdirSync(join(root, "src/lessons"), { recursive: true });
    writeFileSync(join(root, "src/App.tsx"), `<Course courseId="my-course" />`);
    writeFileSync(join(root, "src/lessons/L1.tsx"), `<Quiz checkId="nested-check" />`);

    const issues = validateReactManifestParity({
      projectRoot: root,
      descriptor: testDescriptor({
        courseId: "my-course",
        assessments: [{ checkId: "nested-check", question: "Q", choices: ["a"], answer: "a" }],
      }),
    });

    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("errors when no scannable source exists", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));

    const issues = validateReactManifestParity({
      projectRoot: root,
      descriptor: testDescriptor({
        courseId: "my-course",
        assessments: [{ checkId: "q", question: "Q", choices: ["a"], answer: "a" }],
      }),
    });

    expect(issues.some((i) => i.severity === "error")).toBe(true);
  });

  it("rejects courseId only inside string literals", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(
      join(root, "src/App.tsx"),
      `const hint = 'courseId="my-course" checkId="quiz-1"'; export default () => <Course courseId="other" />;`,
    );

    const issues = validateReactManifestParity({
      projectRoot: root,
      descriptor: testDescriptor({
        courseId: "my-course",
        assessments: [{ checkId: "quiz-1", question: "Q", choices: ["a"], answer: "a" }],
      }),
    });

    expect(issues.some((i) => i.path === "course.courseId" && i.severity === "error")).toBe(true);
    expect(issues.some((i) => i.path === "assessments.checkId:quiz-1" && i.severity === "error")).toBe(
      true,
    );
  });

  it("ignores unsafe appSources paths", () => {
    const root = mkdtempSync(join(tmpdir(), "lk-parity-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "src/App.tsx"), `<Course courseId="my-course" />`);

    const issues = validateReactManifestParity({
      projectRoot: root,
      appSources: ["../escape/App.tsx", "src/App.tsx"],
      descriptor: testDescriptor({
        courseId: "my-course",
        assessments: [],
      }),
    });

    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });
});
