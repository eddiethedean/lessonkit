import type { AssessmentDescriptor, LessonkitCourseDescriptor, McqAssessmentDescriptor } from "./types";
import { isMultiSelectMcq } from "@lessonkit/core";

/** Default passing threshold (1.0 = 100%) when descriptor omits passingScore — matches React SPA default. */
const DEFAULT_SHELL_PASSING_SCORE = 1;

export type LxpackInjectedAssessment = {
  id: string;
  title?: string;
  passingScore: number;
  maxAttempts?: number;
  shuffleChoices?: boolean;
  showFeedback?: "never" | "immediate" | "end";
  questions: Array<{
    id: string;
    prompt: string;
    explanation?: string;
    selectionMode?: "single" | "multiple";
    choices: Array<{ id: string; text: string; correct?: boolean }>;
  }>;
};

/** Escape text embedded into LMS shell / SCORM interchange payloads. */
export function escapeShellText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeShellEntities(text: string): string {
  return text
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)));
}

function containsUnsafeShellMarkup(text: string): boolean {
  const decoded = decodeShellEntities(text);
  return (
    /<\/script/i.test(decoded) ||
    /<!--/.test(decoded) ||
    /<[a-zA-Z!/]/.test(decoded)
  );
}

function sanitizeShellField(text: string): string | null {
  if (containsUnsafeShellMarkup(text)) return null;
  return escapeShellText(text);
}

function slugChoiceId(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  const stem = base.length ? base : "choice";
  return `${stem}-${index + 1}`;
}

function mcqToLxpack(assessment: McqAssessmentDescriptor): LxpackInjectedAssessment | null {
  const checkId = sanitizeShellField(assessment.checkId);
  const prompt = sanitizeShellField(assessment.question);
  if (!checkId || !prompt) return null;

  const normalizedAnswer = assessment.answer.trim();
  const multiCorrect =
    assessment.answers && assessment.answers.length > 1
      ? new Set(assessment.answers.map((a) => a.trim()))
      : new Set([normalizedAnswer]);
  const choices = assessment.choices.map((text, index) => {
    const sanitizedText = sanitizeShellField(text);
    if (!sanitizedText) return null;
    const id = slugChoiceId(text, index);
    return {
      id,
      text: sanitizedText,
      correct: multiCorrect.has(text.trim()),
    };
  });

  if (choices.some((choice) => choice === null)) return null;

  const multiSelect = isMultiSelectMcq(assessment);

  return {
    id: checkId,
    passingScore: assessment.passingScore ?? DEFAULT_SHELL_PASSING_SCORE,
    shuffleChoices: assessment.shuffleChoices === true ? true : undefined,
    showFeedback:
      assessment.choiceFeedback && Object.keys(assessment.choiceFeedback).length > 0
        ? "immediate"
        : undefined,
    questions: [
      {
        id: "q1",
        prompt,
        ...(multiSelect ? { selectionMode: "multiple" as const } : {}),
        choices: choices as Array<{ id: string; text: string; correct?: boolean }>,
      },
    ],
  };
}

export function assessmentDescriptorToLxpack(
  assessment: AssessmentDescriptor,
): LxpackInjectedAssessment | null {
  const kind = assessment.kind ?? "mcq";
  if (kind === "trueFalse" && assessment.kind === "trueFalse") {
    const choices = ["True", "False"];
    const answerText = assessment.answer ? "True" : "False";
    return mcqToLxpack({
      kind: "mcq",
      checkId: assessment.checkId,
      question: assessment.question,
      choices,
      answer: answerText,
      passingScore: assessment.passingScore,
    });
  }
  if (kind === "fillInBlanks") {
    return null;
  }
  // findHotspot is not supported in LMS shell exports (use in-SPA assessment only).
  if (kind === "findHotspot") {
    return null;
  }
  if (kind === "findMultipleHotspots") {
    return null;
  }
  if (kind === "sortParagraphs" || kind === "guessTheAnswer") {
    return null;
  }
  if (kind === "multimediaChoice" && assessment.kind === "multimediaChoice") {
    return mcqToLxpack({
      kind: "mcq",
      checkId: assessment.checkId,
      question: assessment.question,
      choices: assessment.choices,
      answer: assessment.answer,
      passingScore: assessment.passingScore,
    });
  }
  if (
    (kind === "mcq" || assessment.kind === undefined) &&
    "choices" in assessment &&
    "answer" in assessment &&
    typeof assessment.answer === "string"
  ) {
    return mcqToLxpack(assessment as McqAssessmentDescriptor);
  }
  return null;
}

export function extractAssessments(
  descriptor: LessonkitCourseDescriptor,
): LxpackInjectedAssessment[] {
  return (descriptor.assessments ?? [])
    .map(assessmentDescriptorToLxpack)
    .filter((a): a is LxpackInjectedAssessment => a !== null);
}
