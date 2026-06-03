import { validateId } from "@lessonkit/core";
import type { LessonkitCourseDescriptor, McqAssessmentDescriptor } from "../types";

export function normalizeDescriptor(input: LessonkitCourseDescriptor): LessonkitCourseDescriptor {
  const course = validateId(input.courseId, "courseId");
  if (!course.ok) throw new Error("normalizeDescriptor called with invalid courseId");

  return {
    ...input,
    courseId: course.id,
    title: input.title.trim(),
    version: input.version?.trim() || undefined,
    spaLessonId: input.spaLessonId?.trim() || undefined,
    lessons: input.lessons.map((lesson) => {
      const idResult = validateId(lesson.id, "lessonId");
      if (!idResult.ok) throw new Error("normalizeDescriptor called with invalid lesson id");
      return {
        ...lesson,
        id: idResult.id,
        title: lesson.title.trim(),
        spaPath: lesson.spaPath?.trim() || undefined,
      };
    }),
    assessments: input.assessments?.map((assessment) => {
      const check = validateId(assessment.checkId, "checkId");
      if (!check.ok) throw new Error("normalizeDescriptor called with invalid checkId");
      const question = assessment.question.trim();
      if (assessment.kind === "trueFalse") {
        return { ...assessment, checkId: check.id, question };
      }
      if (assessment.kind === "fillInBlanks") {
        return {
          ...assessment,
          checkId: check.id,
          question,
          template: assessment.template.trim(),
          blanks: assessment.blanks?.map((b) => ({
            id: b.id.trim(),
            answer: b.answer.trim(),
          })),
        };
      }
      if (assessment.kind === "findHotspot") {
        return {
          ...assessment,
          checkId: check.id,
          question,
          src: assessment.src.trim(),
          alt: assessment.alt.trim(),
          correctTargetId: assessment.correctTargetId.trim(),
        };
      }
      if (assessment.kind === "findMultipleHotspots") {
        return {
          ...assessment,
          checkId: check.id,
          question,
          src: assessment.src.trim(),
          alt: assessment.alt.trim(),
          correctTargetIds: assessment.correctTargetIds.map((id) => id.trim()).filter((id) => id.length > 0),
        };
      }
      const mcq = assessment as McqAssessmentDescriptor;
      return {
        ...mcq,
        checkId: check.id,
        question,
        choices: mcq.choices.map((c) => c.trim()).filter((c) => c.length > 0),
        answer: mcq.answer.trim(),
      };
    }),
  };
}
