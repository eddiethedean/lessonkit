import { assessmentDescriptorToLxpack } from "../assessments";
import type { LessonkitCourseDescriptor } from "../types";
import type { ValidationIssue } from "../validationIssue";

/** Fail when descriptor assessments cannot be injected into an LXPack LMS shell. */
export function validateInjectableAssessments(
  descriptor: LessonkitCourseDescriptor,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const spaOnlyKinds = new Set(["fillInBlanks", "findHotspot", "findMultipleHotspots"]);
  (descriptor.assessments ?? []).forEach((assessment, index) => {
    if (assessmentDescriptorToLxpack(assessment) === null) {
      const kind = assessment.kind ?? "mcq";
      const hint = spaOnlyKinds.has(kind)
        ? " — score in the SPA only; remove from lessonkit.json for LMS targets or use an injectable kind (mcq, trueFalse)"
        : "";
      issues.push({
        path: `assessments[${index}]`,
        message: `assessment kind "${kind}" (checkId "${assessment.checkId}") is not injected into LMS shell quizzes${hint}`,
      });
    }
  });
  return issues;
}
