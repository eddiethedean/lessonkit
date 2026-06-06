import type { ExportTarget } from "@lxpack/api";
import { validateInjectableAssessments } from "./validateInjectableAssessments";
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
    } else if (!/^https:\/\/.+/i.test(activityIri)) {
      issues.push({
        path: "course.tracking.xapi.activityIri",
        message: "tracking.xapi.activityIri must be an HTTPS URL for xapi and cmi5 export targets",
      });
    }
  }

  if (LMS_SHELL_TARGETS.has(target)) {
    issues.push(...validateInjectableAssessments(descriptor).map((issue) => ({
      ...issue,
      message: `${issue.message} for target "${target}"`,
    })));
  }

  return issues;
}
