import type { AssessmentDescriptor, LessonkitCourseDescriptor } from "./types";
import { mapLessonkitIds } from "./mapIds";

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
  return base.length ? base : `choice-${index + 1}`;
}

export function assessmentDescriptorToLxpack(
  assessment: AssessmentDescriptor,
): LxpackInjectedAssessment {
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

export function extractAssessments(
  descriptor: LessonkitCourseDescriptor,
): LxpackInjectedAssessment[] {
  mapLessonkitIds(descriptor);
  return (descriptor.assessments ?? []).map(assessmentDescriptorToLxpack);
}
