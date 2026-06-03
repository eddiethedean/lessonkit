import type { ExportTarget } from "@lxpack/api";
import type { LessonkitCourseDescriptor } from "../types";
import type { ValidationIssue } from "../validationIssue";

export function validateDescriptorForExportTarget(
  descriptor: LessonkitCourseDescriptor,
  target: ExportTarget,
): ValidationIssue[] {
  if (target !== "xapi" && target !== "cmi5") return [];
  const activityIri = descriptor.tracking?.xapi?.activityIri?.trim();
  if (!activityIri) {
    return [
      {
        path: "course.tracking.xapi.activityIri",
        message: "tracking.xapi.activityIri is required for xapi and cmi5 export targets",
      },
    ];
  }
  return [];
}
