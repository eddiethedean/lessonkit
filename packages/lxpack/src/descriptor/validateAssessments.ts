import { validateId } from "@lessonkit/core";
import type { AssessmentDescriptor } from "../types";
import type { ValidationIssue } from "../validationIssue";
import { isMultiSelectMcq } from "@lessonkit/core";

export type AssessmentKind = NonNullable<AssessmentDescriptor["kind"]> | "mcq";

type AssessmentValidator = (
  assessment: AssessmentDescriptor,
  path: string,
  issues: ValidationIssue[],
) => void;

const validateMcqLike: AssessmentValidator = (assessment, path, issues) => {
  if (!("choices" in assessment) || !Array.isArray(assessment.choices)) {
    issues.push({ path: `${path}.choices`, message: "choices is required for mcq" });
    return;
  }
  if (!("answer" in assessment) || typeof assessment.answer !== "string") {
    issues.push({ path: `${path}.answer`, message: "answer is required for mcq" });
    return;
  }
  const trimmedChoices = assessment.choices.map((c) => c.trim()).filter((c) => c.length > 0);
  if (!trimmedChoices.length) {
    issues.push({ path: `${path}.choices`, message: "at least one non-empty choice is required" });
  }
  if (!assessment.answer.trim()) {
    issues.push({ path: `${path}.answer`, message: "answer is required" });
  } else if (!isMultiSelectMcq(assessment) && trimmedChoices.length && !trimmedChoices.includes(assessment.answer.trim())) {
    issues.push({ path: `${path}.answer`, message: "answer must match a choice" });
  }
  if ("answers" in assessment && assessment.answers !== undefined) {
    if (!Array.isArray(assessment.answers)) {
      issues.push({ path: `${path}.answers`, message: "answers must be an array when provided" });
    } else {
      const trimmedAnswers = assessment.answers.map((a) => a.trim()).filter((a) => a.length > 0);
      if (assessment.answers.length > 0 && trimmedAnswers.length === 0) {
        issues.push({ path: `${path}.answers`, message: "answers must include non-empty strings" });
      }
      const uniqueAnswers = new Set(trimmedAnswers);
      if (trimmedAnswers.length !== uniqueAnswers.size) {
        issues.push({ path: `${path}.answers`, message: "answers must be unique" });
      }
      for (const ans of trimmedAnswers) {
        if (trimmedChoices.length && !trimmedChoices.includes(ans)) {
          issues.push({ path: `${path}.answers`, message: "each answer must match a choice" });
          break;
        }
      }
    }
  }
  if ("choiceFeedback" in assessment && assessment.choiceFeedback !== undefined) {
    if (typeof assessment.choiceFeedback !== "object" || assessment.choiceFeedback === null) {
      issues.push({ path: `${path}.choiceFeedback`, message: "choiceFeedback must be an object" });
    } else {
      for (const key of Object.keys(assessment.choiceFeedback)) {
        if (!trimmedChoices.includes(key.trim())) {
          issues.push({
            path: `${path}.choiceFeedback`,
            message: "choiceFeedback keys must match choice labels",
          });
          break;
        }
      }
    }
  }
  const uniqueChoices = new Set(trimmedChoices);
  if (trimmedChoices.length !== uniqueChoices.size) {
    issues.push({ path: `${path}.choices`, message: "choices must be unique" });
  }
};

function countStarDelimitedBlanks(template: string): number {
  const matches = template.match(/\*[^*]+\*/g);
  return matches?.length ?? 0;
}

/** Maximum points achievable for this assessment in runtime and LMS shell injection. */
export function maxAchievableAssessmentScore(assessment: AssessmentDescriptor): number {
  const kind = assessment.kind ?? "mcq";
  if (kind === "fillInBlanks" && assessment.kind === "fillInBlanks") {
    const explicit = assessment.blanks?.filter((b) => b?.id?.trim() && b?.answer?.trim()).length ?? 0;
    if (explicit > 0) return explicit;
    return countStarDelimitedBlanks(assessment.template ?? "");
  }
  if (kind === "findMultipleHotspots" && assessment.kind === "findMultipleHotspots") {
    return (
      assessment.correctTargetIds?.map((id) => id.trim()).filter((id) => id.length > 0).length ?? 0
    );
  }
  if (kind === "sortParagraphs" && assessment.kind === "sortParagraphs") {
    return assessment.paragraphs?.length ?? assessment.correctOrder?.length ?? 0;
  }
  if (
    "answers" in assessment &&
    Array.isArray(assessment.answers) &&
    assessment.answers.length > 1
  ) {
    return assessment.answers.filter((a) => a.trim().length > 0).length;
  }
  return 1;
}

export const ASSESSMENT_VALIDATORS: Record<AssessmentKind, AssessmentValidator> = {
  mcq: validateMcqLike,
  trueFalse: (assessment, path, issues) => {
    if (assessment.kind === "trueFalse" && typeof assessment.answer !== "boolean") {
      issues.push({ path: `${path}.answer`, message: "answer must be a boolean for trueFalse" });
    }
  },
  fillInBlanks: (assessment, path, issues) => {
    if (assessment.kind !== "fillInBlanks") return;
    if (!assessment.template?.trim()) {
      issues.push({ path: `${path}.template`, message: "template is required for fillInBlanks" });
      return;
    }
    const templateBlankCount = countStarDelimitedBlanks(assessment.template);
    if (templateBlankCount === 0) {
      issues.push({
        path: `${path}.template`,
        message: "template must include at least one blank wrapped in asterisks for fillInBlanks",
      });
    }
    const explicitBlanks: Array<{ id: string; answer: string }> = [];
    if (assessment.blanks !== undefined) {
      for (let i = 0; i < assessment.blanks.length; i++) {
        const blank = assessment.blanks[i];
        if (!blank || typeof blank !== "object") {
          issues.push({
            path: `${path}.blanks[${i}]`,
            message: "blank entry must be an object with non-empty id and answer",
          });
          continue;
        }
        const id = blank.id?.trim() ?? "";
        const answer = blank.answer?.trim() ?? "";
        if (!id || !answer) {
          issues.push({
            path: `${path}.blanks[${i}]`,
            message: "blank entry must include non-empty id and answer",
          });
          continue;
        }
        explicitBlanks.push({ id, answer });
      }
    }
    if (
      assessment.blanks !== undefined &&
      explicitBlanks.length === 0 &&
      !issues.some((issue) => issue.path?.startsWith(`${path}.blanks`))
    ) {
      issues.push({
        path: `${path}.blanks`,
        message: "blanks must include at least one entry with non-empty id and answer",
      });
    }
    if (explicitBlanks.length > 0 && explicitBlanks.length !== templateBlankCount) {
      issues.push({
        path: `${path}.blanks`,
        message: `blanks length (${explicitBlanks.length}) must match template blank count (${templateBlankCount})`,
      });
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
  sortParagraphs: (assessment, path, issues) => {
    if (assessment.kind !== "sortParagraphs") return;
    if (!Array.isArray(assessment.paragraphs) || assessment.paragraphs.length === 0) {
      issues.push({ path: `${path}.paragraphs`, message: "paragraphs is required for sortParagraphs" });
      return;
    }
    if (!Array.isArray(assessment.correctOrder) || assessment.correctOrder.length === 0) {
      issues.push({ path: `${path}.correctOrder`, message: "correctOrder is required for sortParagraphs" });
      return;
    }
    if (assessment.correctOrder.length !== assessment.paragraphs.length) {
      issues.push({
        path: `${path}.correctOrder`,
        message: "correctOrder length must match paragraphs length for sortParagraphs",
      });
    }
  },
  guessTheAnswer: (assessment, path, issues) => {
    if (assessment.kind !== "guessTheAnswer") return;
    if (!assessment.answer?.trim()) {
      issues.push({ path: `${path}.answer`, message: "answer is required for guessTheAnswer" });
    }
  },
  multimediaChoice: validateMcqLike,
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
  } else if (passingScore !== undefined) {
    const maxAchievable = maxAchievableAssessmentScore(assessment);
    if (maxAchievable > 0 && passingScore > maxAchievable) {
      issues.push({
        path: `${path}.passingScore`,
        message: `passingScore cannot exceed achievable score (${maxAchievable}) for this assessment kind`,
      });
    }
  }
}
