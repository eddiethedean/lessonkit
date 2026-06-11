import type { LessonkitInterchangeV1 } from "@lxpack/validators";
import { extractAssessments } from "../assessments";
import { validateInjectableAssessments } from "../descriptor/validateInjectableAssessments";
import type { LessonkitCourseDescriptor } from "../types";
import type { LkcourseValidationIssue } from "./types";

/** Reject descriptors/archives with SPA-only assessments or interchange drift. */
export function validateLkcourseAssessmentConsistency(
  descriptor: LessonkitCourseDescriptor,
  interchange: LessonkitInterchangeV1,
): LkcourseValidationIssue[] {
  const issues: LkcourseValidationIssue[] = [];

  for (const issue of validateInjectableAssessments(descriptor)) {
    issues.push({
      path: `sourceManifest.course.${issue.path}`,
      message: issue.message,
    });
  }

  const expectedIds = extractAssessments(descriptor)
    .map((a) => a.id)
    .sort();
  const interchangeIds = (interchange.assessments ?? [])
    .map((a) => a.id)
    .sort();

  const matches =
    expectedIds.length === interchangeIds.length &&
    expectedIds.every((id, index) => id === interchangeIds[index]);

  if (!matches) {
    issues.push({
      path: "interchange.assessments",
      message: `injectable assessment ids [${expectedIds.join(", ")}] do not match interchange [${interchangeIds.join(", ")}]`,
    });
  }

  return issues;
}
