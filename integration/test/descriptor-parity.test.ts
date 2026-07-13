import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ID_PATTERN } from "@lessonkit/core";
import { GOLDEN_DIR } from "./helpers/paths.js";

type LessonkitManifest = {
  course: {
    courseId: string;
    lessons: Array<{ id: string }>;
    assessments?: Array<{ checkId: string }>;
  };
};

function extractDescriptorIds(descriptorSource: string): {
  courseId: string;
  lessonIds: string[];
  checkIds: string[];
} {
  const courseIdMatch = descriptorSource.match(/courseId:\s*"([^"]+)"/);
  const lessonIds = [...descriptorSource.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]!);
  const checkIds = [...descriptorSource.matchAll(/checkId:\s*"([^"]+)"/g)].map((m) => m[1]!);

  return {
    courseId: courseIdMatch?.[1] ?? "",
    lessonIds,
    checkIds,
  };
}

describe("golden descriptor parity", () => {
  const manifest = JSON.parse(
    readFileSync(join(GOLDEN_DIR, "lessonkit.json"), "utf8"),
  ) as LessonkitManifest;
  const descriptorSource = readFileSync(join(GOLDEN_DIR, "course.descriptor.ts"), "utf8");
  const appSource = readFileSync(join(GOLDEN_DIR, "src/App.tsx"), "utf8");
  const descriptor = extractDescriptorIds(descriptorSource);

  it("courseId matches between lessonkit.json and course.descriptor.ts", () => {
    expect(manifest.course.courseId).toBe(descriptor.courseId);
    expect(appSource).toContain(`COURSE_ID = "${manifest.course.courseId}"`);
    expect(appSource).toContain(`courseId={COURSE_ID}`);
  });

  it("lesson ids match between manifest and descriptor", () => {
    const manifestLessonIds = manifest.course.lessons.map((l) => l.id).sort();
    const descriptorLessonIds = [...new Set(descriptor.lessonIds)].sort();
    expect(descriptorLessonIds).toEqual(expect.arrayContaining(manifestLessonIds));
    for (const id of manifestLessonIds) {
      expect(appSource).toContain(`id: "${id}"`);
    }
  });

  it("assessment checkIds match between manifest, descriptor, and App source", () => {
    const manifestChecks = (manifest.course.assessments ?? []).map((a) => a.checkId).sort();
    const descriptorChecks = [...new Set(descriptor.checkIds)].sort();
    expect(descriptorChecks).toEqual(expect.arrayContaining(manifestChecks));
    for (const checkId of manifestChecks) {
      expect(ID_PATTERN.test(checkId)).toBe(true);
      expect(appSource).toContain(`checkId="${checkId}"`);
    }
  });

  it("manifest course object has required packaging fields with valid identity ids", () => {
    expect(ID_PATTERN.test(manifest.course.courseId)).toBe(true);
    expect(manifest.course.lessons.length).toBeGreaterThan(0);
    for (const lesson of manifest.course.lessons) {
      expect(ID_PATTERN.test(lesson.id)).toBe(true);
    }
  });
});
