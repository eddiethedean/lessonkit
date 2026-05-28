import { validateId } from "@lessonkit/core";
import type { LessonkitCourseDescriptor } from "./types";
import { isSafeRelativeSpaPath } from "./spaPath";

export type DescriptorValidationIssue = {
  path: string;
  message: string;
};

export type DescriptorValidationResult =
  | { ok: true; descriptor: LessonkitCourseDescriptor }
  | { ok: false; issues: DescriptorValidationIssue[] };

function normalizeDescriptor(input: LessonkitCourseDescriptor): LessonkitCourseDescriptor {
  const course = validateId(input.courseId, "courseId");
  if (!course.ok) throw new Error("normalizeDescriptor called with invalid courseId");

  return {
    ...input,
    courseId: course.id,
    title: input.title.trim(),
    version: input.version?.trim() || undefined,
    spaLessonId: input.spaLessonId?.trim() || undefined,
    lessons: input.lessons.map((lesson) => {
      const idResult = validateId(lesson.id, "lessonId");
      if (!idResult.ok) throw new Error("normalizeDescriptor called with invalid lesson id");
      return {
        ...lesson,
        id: idResult.id,
        title: lesson.title.trim(),
        spaPath: lesson.spaPath?.trim() || undefined,
      };
    }),
    assessments: input.assessments?.map((assessment) => {
      const check = validateId(assessment.checkId, "checkId");
      if (!check.ok) throw new Error("normalizeDescriptor called with invalid checkId");
      return {
        ...assessment,
        checkId: check.id,
        question: assessment.question.trim(),
        choices: assessment.choices.map((c) => c.trim()).filter((c) => c.length > 0),
        answer: assessment.answer.trim(),
      };
    }),
  };
}

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
  const spaPaths = new Set<string>();
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
    if (input.layout === "per-lesson-spa") {
      const spaPath = lesson.spaPath?.trim();
      if (!spaPath) {
        issues.push({
          path: `${path}.spaPath`,
          message: "spaPath is required for per-lesson-spa layout",
        });
      } else if (!isSafeRelativeSpaPath(spaPath)) {
        issues.push({
          path: `${path}.spaPath`,
          message:
            "spaPath must be a relative path without '..' segments or absolute prefixes",
        });
      } else if (spaPaths.has(spaPath)) {
        issues.push({ path: `${path}.spaPath`, message: "duplicate spaPath" });
      } else {
        spaPaths.add(spaPath);
      }
    }
  }

  if (input.layout === "single-spa" && input.spaLessonId?.trim()) {
    const spaId = input.spaLessonId.trim();
    const spaResult = validateId(spaId, "spaLessonId");
    if (!spaResult.ok) {
      issues.push(...spaResult.issues.map((i) => ({ path: i.path, message: i.message })));
    } else if (!lessonIds.has(spaResult.id)) {
      issues.push({
        path: "spaLessonId",
        message: "spaLessonId must match a lesson id in lessons",
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
    const trimmedChoices = (assessment.choices ?? []).map((c) => c.trim()).filter((c) => c.length > 0);
    if (!trimmedChoices.length) {
      issues.push({
        path: `${path}.choices`,
        message: "at least one non-empty choice is required",
      });
    }
    if (!assessment.answer?.trim()) {
      issues.push({ path: `${path}.answer`, message: "answer is required" });
    } else if (trimmedChoices.length && !trimmedChoices.includes(assessment.answer.trim())) {
      issues.push({ path: `${path}.answer`, message: "answer must match a choice" });
    }
    const passingScore = assessment.passingScore;
    if (passingScore !== undefined) {
      if (!(passingScore > 0)) {
        issues.push({
          path: `${path}.passingScore`,
          message: "passingScore must be greater than 0",
        });
      } else if (trimmedChoices.length && passingScore > trimmedChoices.length) {
        issues.push({
          path: `${path}.passingScore`,
          message: "passingScore must not exceed the number of choices",
        });
      }
    }
  }

  if (issues.length) return { ok: false, issues };
  return { ok: true, descriptor: normalizeDescriptor(input) };
}
