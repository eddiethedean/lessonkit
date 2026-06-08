import type { LessonId } from "@lessonkit/core";
import type { LessonkitInterchangeV1 } from "@lxpack/validators";
import { extractAssessments } from "./assessments";
import { mapLessonkitIds } from "./mapIds";
import { themeToLxpackRuntime } from "./theme";
import type { LessonkitCourseDescriptor } from "./types";

export type { LessonkitInterchangeV1 } from "@lxpack/validators";

export type SpaLessonEntry = {
  id: LessonId;
  title: string;
  path: string;
};

function mapDescriptorTracking(
  tracking: LessonkitCourseDescriptor["tracking"],
): LessonkitInterchangeV1["tracking"] | undefined {
  if (!tracking) return undefined;

  const mapped: NonNullable<LessonkitInterchangeV1["tracking"]> = {};

  if (tracking.completion?.threshold !== undefined) {
    mapped.completion = { threshold: tracking.completion.threshold };
  }

  const activityIri = tracking.xapi?.activityIri?.trim();
  if (activityIri) {
    mapped.xapi = { activityIri };
  }

  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

export function resolveSpaLessons(descriptor: LessonkitCourseDescriptor): SpaLessonEntry[] {
  const mapped = mapLessonkitIds(descriptor);

  if (descriptor.layout === "single-spa") {
    const spaLessonId =
      descriptor.spaLessonId ?? mapped.lessonIds[0] ?? "main";
    const firstLesson = descriptor.lessons.find((l) => l.id === spaLessonId);
    return [
      {
        id: spaLessonId,
        title: firstLesson?.title ?? descriptor.title,
        path: "dist",
      },
    ];
  }

  return descriptor.lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    path: lesson.spaPath!,
  }));
}

/**
 * Convert a `lessonkit.json` course descriptor to portable interchange JSON for `.lkcourse`.
 *
 * @example
 * ```ts
 * import { descriptorToInterchange } from "@lessonkit/lxpack";
 *
 * const interchange = descriptorToInterchange(manifest.course);
 * ```
 */
export function descriptorToInterchange(
  descriptor: LessonkitCourseDescriptor,
): LessonkitInterchangeV1 {
  const mapped = mapLessonkitIds(descriptor);
  const spaLessons = resolveSpaLessons(descriptor);

  const runtime = descriptor.theme ? themeToLxpackRuntime(descriptor.theme) : undefined;
  const assessments = extractAssessments(descriptor);

  return {
    format: "lessonkit",
    version: "1",
    course: {
      id: mapped.courseId,
      title: descriptor.title,
    },
    lessons: spaLessons.map((l) => ({
      id: l.id,
      title: l.title,
      type: "spa",
      path: l.path,
    })),
    tracking: mapDescriptorTracking(descriptor.tracking),
    runtime: runtime
      ? {
          theme: runtime.theme,
          cssVariables: runtime.cssVariables,
        }
      : undefined,
    assessments: assessments.length ? assessments : undefined,
  };
}
