import { assertValidId } from "@lessonkit/core";
import type { LessonkitCourseDescriptor, MappedLessonkitIds } from "./types";

/**
 * Stable 1:1 mapping from LessonKit ids to LXPack manifest ids.
 * LessonKit slug rules already match LXPack `activityIdSchema` (letter-first, alphanumeric + _ -).
 */
export function mapLessonkitIds(descriptor: LessonkitCourseDescriptor): MappedLessonkitIds {
  const courseId = assertValidId(descriptor.courseId, "courseId");
  const lessonIds = descriptor.lessons.map((l) => assertValidId(l.id, "lessonId"));
  const checkIds = (descriptor.assessments ?? []).map((a) =>
    assertValidId(a.checkId, "checkId"),
  );
  return { courseId, lessonIds, checkIds };
}
