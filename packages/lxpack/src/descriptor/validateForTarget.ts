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

function appendActivityIriIssues(
  issues: ValidationIssue[],
  descriptor: LessonkitCourseDescriptor,
  target: ExportTarget,
): void {
  const hasXapiTracking = Boolean(descriptor.tracking?.xapi?.activityIri?.trim());
  const requiresForTarget = target === "xapi" || target === "cmi5";
  if (!hasXapiTracking && !requiresForTarget) return;

  const activityIri = descriptor.tracking?.xapi?.activityIri?.trim();
  const targetSuffix =
    target === "xapi" || target === "cmi5"
      ? ` for ${target} export targets`
      : " when tracking.xapi is configured";

  if (!activityIri) {
    issues.push({
      path: "tracking.xapi.activityIri",
      message: `tracking.xapi.activityIri is required${targetSuffix}`,
    });
    return;
  }

  if (!/^https:\/\/.+/i.test(activityIri)) {
    issues.push({
      path: "tracking.xapi.activityIri",
      message: `tracking.xapi.activityIri must be an HTTPS URL${targetSuffix}`,
    });
  }
}

export function validateDescriptorForExportTarget(
  descriptor: LessonkitCourseDescriptor,
  target: ExportTarget,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  appendActivityIriIssues(issues, descriptor, target);

  if (LMS_SHELL_TARGETS.has(target)) {
    issues.push(...validateInjectableAssessments(descriptor).map((issue) => ({
      ...issue,
      message: `${issue.message} for target "${target}"`,
    })));
  }

  return issues;
}
