import { validateId } from "@lessonkit/core";
import type { LessonkitCourseDescriptor } from "./types";

export type DescriptorValidationIssue = {
  path: string;
  message: string;
};

export type DescriptorValidationResult =
  | { ok: true; descriptor: LessonkitCourseDescriptor }
  | { ok: false; issues: DescriptorValidationIssue[] };

export function validateDescriptor(
  input: LessonkitCourseDescriptor,
): DescriptorValidationResult {
  const issues: DescriptorValidationIssue[] = [];

  const course = validateId(input.courseId, "courseId");
  if (!course.ok) issues.push(...course.issues.map((i) => ({ path: i.path, message: i.message })));

  if (!input.title?.trim()) {
    issues.push({ path: "title", message: "title is required" });
  }

  if (!input.lessons?.length) {
    issues.push({ path: "lessons", message: "at least one lesson is required" });
  }

  if (input.layout === "single-spa" && (input.lessons?.length ?? 0) > 1) {
    issues.push({
      path: "lessons",
      message:
        "single-spa layout packages one SPA lesson; remove extra lesson entries or use per-lesson-spa",
    });
  }

  const lessonIds = new Set<string>();
  for (const [index, lesson] of (input.lessons ?? []).entries()) {
    const path = `lessons[${index}]`;
    const lessonResult = validateId(lesson.id, `${path}.id`);
    if (!lessonResult.ok) {
      issues.push(...lessonResult.issues.map((i) => ({ path: i.path, message: i.message })));
    } else if (lessonIds.has(lessonResult.id)) {
      issues.push({ path: `${path}.id`, message: "duplicate lesson id" });
    } else {
      lessonIds.add(lessonResult.id);
    }
    if (!lesson.title?.trim()) {
      issues.push({ path: `${path}.title`, message: "lesson title is required" });
    }
    if (input.layout === "per-lesson-spa" && !lesson.spaPath?.trim()) {
      issues.push({
        path: `${path}.spaPath`,
        message: "spaPath is required for per-lesson-spa layout",
      });
    }
  }

  const checkIds = new Set<string>();
  for (const [index, assessment] of (input.assessments ?? []).entries()) {
    const path = `assessments[${index}]`;
    const check = validateId(assessment.checkId, `${path}.checkId`);
    if (!check.ok) {
      issues.push(...check.issues.map((i) => ({ path: i.path, message: i.message })));
    } else if (checkIds.has(check.id)) {
      issues.push({ path: `${path}.checkId`, message: "duplicate checkId" });
    } else {
      checkIds.add(check.id);
    }
    if (!assessment.question?.trim()) {
      issues.push({ path: `${path}.question`, message: "question is required" });
    }
    if (!assessment.choices?.length) {
      issues.push({ path: `${path}.choices`, message: "at least one choice is required" });
    }
    if (!assessment.answer?.trim()) {
      issues.push({ path: `${path}.answer`, message: "answer is required" });
    } else if (
      assessment.choices?.length &&
      !assessment.choices.includes(assessment.answer)
    ) {
      issues.push({ path: `${path}.answer`, message: "answer must match a choice" });
    }
  }

  if (issues.length) return { ok: false, issues };
  return { ok: true, descriptor: input };
}
