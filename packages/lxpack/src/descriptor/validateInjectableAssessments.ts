import { assessmentDescriptorToLxpack } from "../assessments";
import type { LessonkitCourseDescriptor } from "../types";
import type { ValidationIssue } from "../validationIssue";

/** Fail when descriptor assessments cannot be injected into an LXPack LMS shell. */
export function validateInjectableAssessments(
  descriptor: LessonkitCourseDescriptor,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  (descriptor.assessments ?? []).forEach((assessment, index) => {
    if (assessmentDescriptorToLxpack(assessment) === null) {
      issues.push({
        path: `assessments[${index}]`,
        message: `assessment kind "${assessment.kind ?? "mcq"}" (checkId "${assessment.checkId}") is not injected into LMS shell quizzes`,
      });
    }
  });
  return issues;
}
