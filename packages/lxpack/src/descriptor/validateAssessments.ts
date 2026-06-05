import { validateId } from "@lessonkit/core";
import type { AssessmentDescriptor } from "../types";
import type { ValidationIssue } from "../validationIssue";

export type AssessmentKind = NonNullable<AssessmentDescriptor["kind"]> | "mcq";

type AssessmentValidator = (
  assessment: AssessmentDescriptor,
  path: string,
  issues: ValidationIssue[],
) => void;

const validateMcqLike: AssessmentValidator = (assessment, path, issues) => {
  if (!("choices" in assessment) || !("answer" in assessment) || typeof assessment.answer !== "string") {
    return;
  }
  const trimmedChoices = assessment.choices.map((c) => c.trim()).filter((c) => c.length > 0);
  if (!trimmedChoices.length) {
    issues.push({ path: `${path}.choices`, message: "at least one non-empty choice is required" });
  }
  if (!assessment.answer.trim()) {
    issues.push({ path: `${path}.answer`, message: "answer is required" });
  } else if (trimmedChoices.length && !trimmedChoices.includes(assessment.answer.trim())) {
    issues.push({ path: `${path}.answer`, message: "answer must match a choice" });
  }
};

export const ASSESSMENT_VALIDATORS: Record<AssessmentKind, AssessmentValidator> = {
  mcq: validateMcqLike,
  trueFalse: (assessment, path, issues) => {
    if (assessment.kind === "trueFalse" && typeof assessment.answer !== "boolean") {
      issues.push({ path: `${path}.answer`, message: "answer must be a boolean for trueFalse" });
    }
  },
  fillInBlanks: (assessment, path, issues) => {
    if (assessment.kind === "fillInBlanks" && !assessment.template?.trim()) {
      issues.push({ path: `${path}.template`, message: "template is required for fillInBlanks" });
    }
  },
  findHotspot: (assessment, path, issues) => {
    if (assessment.kind !== "findHotspot") return;
    if (!assessment.src?.trim()) {
      issues.push({ path: `${path}.src`, message: "src is required for findHotspot" });
    }
    if (!assessment.alt?.trim()) {
      issues.push({ path: `${path}.alt`, message: "alt is required for findHotspot" });
    }
    if (!assessment.correctTargetId?.trim()) {
      issues.push({ path: `${path}.correctTargetId`, message: "correctTargetId is required for findHotspot" });
    }
  },
  findMultipleHotspots: (assessment, path, issues) => {
    if (assessment.kind !== "findMultipleHotspots") return;
    if (!assessment.src?.trim()) {
      issues.push({ path: `${path}.src`, message: "src is required for findMultipleHotspots" });
    }
    if (!assessment.alt?.trim()) {
      issues.push({ path: `${path}.alt`, message: "alt is required for findMultipleHotspots" });
    }
    const ids = assessment.correctTargetIds?.map((id) => id.trim()).filter((id) => id.length > 0) ?? [];
    if (!ids.length) {
      issues.push({
        path: `${path}.correctTargetIds`,
        message: "at least one non-empty correctTargetId is required for findMultipleHotspots",
      });
    }
  },
};

export function validateAssessmentEntry(
  assessment: AssessmentDescriptor,
  index: number,
  issues: ValidationIssue[],
  checkIds: Set<string>,
): void {
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
  const knownKinds = Object.keys(ASSESSMENT_VALIDATORS) as AssessmentKind[];
  if (
    assessment.kind !== undefined &&
    assessment.kind !== "mcq" &&
    !knownKinds.includes(assessment.kind as AssessmentKind)
  ) {
    issues.push({
      path: `${path}.kind`,
      message: `unknown kind; use one of: ${knownKinds.join(", ")}`,
    });
    return;
  }
  const kind = assessment.kind ?? "mcq";
  const validator = ASSESSMENT_VALIDATORS[kind];
  if (!validator) {
    issues.push({
      path: `${path}.kind`,
      message: `unknown kind; use one of: ${knownKinds.join(", ")}`,
    });
    return;
  }
  validator(assessment, path, issues);
  const passingScore = assessment.passingScore;
  if (passingScore !== undefined && !(Number.isFinite(passingScore) && passingScore > 0)) {
    issues.push({
      path: `${path}.passingScore`,
      message: "passingScore must be greater than 0 (absolute point threshold)",
    });
  }
}
