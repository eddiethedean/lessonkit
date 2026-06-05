import type { ExportTarget } from "@lxpack/api";
import { assessmentDescriptorToLxpack } from "../assessments";
import type { LessonkitCourseDescriptor } from "../types";
import type { ValidationIssue } from "../validationIssue";

const LMS_SHELL_TARGETS = new Set<ExportTarget>([
  "scorm12",
  "scorm2004",
  "standalone",
  "xapi",
  "cmi5",
]);

export function validateDescriptorForExportTarget(
  descriptor: LessonkitCourseDescriptor,
  target: ExportTarget,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (target === "xapi" || target === "cmi5") {
    const activityIri = descriptor.tracking?.xapi?.activityIri?.trim();
    if (!activityIri) {
      issues.push({
        path: "course.tracking.xapi.activityIri",
        message: "tracking.xapi.activityIri is required for xapi and cmi5 export targets",
      });
    }
  }

  if (LMS_SHELL_TARGETS.has(target)) {
    (descriptor.assessments ?? []).forEach((assessment, index) => {
      if (assessmentDescriptorToLxpack(assessment) === null) {
        issues.push({
          path: `assessments[${index}]`,
          message: `assessment kind "${assessment.kind ?? "mcq"}" (checkId "${assessment.checkId}") is not injected into LMS shell quizzes for target "${target}"`,
        });
      }
    });
  }

  return issues;
}
