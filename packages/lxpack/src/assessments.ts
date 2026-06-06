import type { AssessmentDescriptor, LessonkitCourseDescriptor, McqAssessmentDescriptor } from "./types";

export type LxpackInjectedAssessment = {
  id: string;
  title?: string;
  passingScore: number;
  questions: Array<{
    id: string;
    prompt: string;
    choices: Array<{ id: string; text: string; correct?: boolean }>;
  }>;
};

function slugChoiceId(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  const stem = base.length ? base : "choice";
  return `${stem}-${index + 1}`;
}

function mcqToLxpack(assessment: McqAssessmentDescriptor): LxpackInjectedAssessment {
  const choices = assessment.choices.map((text, index) => {
    const id = slugChoiceId(text, index);
    return {
      id,
      text,
      correct: text === assessment.answer,
    };
  });

  return {
    id: assessment.checkId,
    passingScore: assessment.passingScore ?? 1,
    questions: [
      {
        id: "q1",
        prompt: assessment.question,
        choices,
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
  if ("choices" in assessment && "answer" in assessment && typeof assessment.answer === "string") {
    return mcqToLxpack(assessment);
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
