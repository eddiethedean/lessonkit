import type { BlockId, CheckId, CourseId, LessonId } from "./identityTypes";
import { assertValidId } from "./validateId";

export type LessonkitUrnParts = {
  courseId: CourseId;
  lessonId?: LessonId;
  checkId?: CheckId;
  blockId?: BlockId;
};

/**
 * Build a stable LessonKit URN for courses, lessons, checks, and blocks.
 * Segments are validated and encoded in path order.
 */
export function buildLessonkitUrn(parts: LessonkitUrnParts): string {
  const courseId = assertValidId(parts.courseId, "courseId");
  let urn = `urn:lessonkit:course:${courseId}`;

  if (parts.lessonId !== undefined) {
    const lessonId = assertValidId(parts.lessonId, "lessonId");
    urn += `:lesson:${lessonId}`;
  }
  if (parts.checkId !== undefined) {
    const checkId = assertValidId(parts.checkId, "checkId");
    if (parts.lessonId === undefined) {
      throw new Error("buildLessonkitUrn: checkId requires lessonId");
    }
    urn += `:check:${checkId}`;
  }
  if (parts.blockId !== undefined) {
    const blockId = assertValidId(parts.blockId, "blockId");
    if (parts.lessonId === undefined) {
      throw new Error("buildLessonkitUrn: blockId requires lessonId");
    }
    urn += `:block:${blockId}`;
  }

  return urn;
}
