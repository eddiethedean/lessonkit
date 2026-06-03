import type { ExportTarget } from "@lxpack/api";
import type { LessonkitCourseDescriptor } from "./types";
import { normalizeDescriptor } from "./descriptor/normalize";
import { parseCourseDescriptorInput } from "./descriptor/parseInput";
import { validateCourseDescriptor } from "./descriptor/validateCourse";
import { validateDescriptorForExportTarget } from "./descriptor/validateForTarget";
import type { ValidationIssue } from "./validationIssue";

export type DescriptorValidationIssue = ValidationIssue;

export type DescriptorValidationResult =
  | { ok: true; descriptor: LessonkitCourseDescriptor }
  | { ok: false; issues: DescriptorValidationIssue[] };

function validateDescriptorParsed(input: LessonkitCourseDescriptor): DescriptorValidationResult {
  const issues = validateCourseDescriptor(input);
  if (issues.length) return { ok: false, issues };
  return { ok: true, descriptor: normalizeDescriptor(input) };
}

export function validateDescriptor(input: unknown): DescriptorValidationResult {
  const parsed = parseCourseDescriptorInput(input);
  if (parsed === null) {
    return { ok: false, issues: [{ path: "course", message: "must be an object" }] };
  }
  return validateDescriptorParsed(parsed);
}

export function validateDescriptorForTarget(
  input: unknown,
  target?: ExportTarget,
): DescriptorValidationResult {
  const result = validateDescriptor(input);
  if (!result.ok || !target) return result;
  const targetIssues = validateDescriptorForExportTarget(result.descriptor, target);
  if (targetIssues.length) {
    return { ok: false, issues: targetIssues };
  }
  return result;
}
