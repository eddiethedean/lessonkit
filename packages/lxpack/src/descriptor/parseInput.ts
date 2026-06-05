import type { LessonkitCourseDescriptor, LessonDescriptor } from "../types";
import type { ThemePresetName } from "@lessonkit/themes";
import type { SpaLayout } from "../types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseLessonDescriptor(raw: unknown): LessonDescriptor {
  if (!isRecord(raw)) {
    return { id: "", title: "" };
  }
  return {
    id: typeof raw.id === "string" ? raw.id : "",
    title: typeof raw.title === "string" ? raw.title : "",
    spaPath: typeof raw.spaPath === "string" ? raw.spaPath : undefined,
  };
}

export function parseAssessmentDescriptor(raw: unknown): import("../types").AssessmentDescriptor {
  if (!isRecord(raw)) {
    return { checkId: "", question: "", choices: [], answer: "" };
  }
  const base = {
    checkId: typeof raw.checkId === "string" ? raw.checkId : "",
    question: typeof raw.question === "string" ? raw.question : "",
    passingScore: typeof raw.passingScore === "number" ? raw.passingScore : undefined,
  };
  const kind = raw.kind;
  if (kind === "trueFalse") {
    return {
      kind: "trueFalse",
      ...base,
      answer: typeof raw.answer === "boolean" ? raw.answer : raw.answer === "true",
    };
  }
  if (kind === "fillInBlanks") {
    return {
      kind: "fillInBlanks",
      ...base,
      template: typeof raw.template === "string" ? raw.template : "",
      blanks: Array.isArray(raw.blanks)
        ? raw.blanks
            .filter((b): b is Record<string, unknown> => isRecord(b))
            .map((b) => ({
              id: typeof b.id === "string" ? b.id : "",
              answer: typeof b.answer === "string" ? b.answer : "",
            }))
        : undefined,
    };
  }
  if (kind === "findHotspot") {
    return {
      kind: "findHotspot",
      ...base,
      src: typeof raw.src === "string" ? raw.src : "",
      alt: typeof raw.alt === "string" ? raw.alt : "",
      correctTargetId: typeof raw.correctTargetId === "string" ? raw.correctTargetId : "",
    };
  }
  if (kind === "findMultipleHotspots") {
    return {
      kind: "findMultipleHotspots",
      ...base,
      src: typeof raw.src === "string" ? raw.src : "",
      alt: typeof raw.alt === "string" ? raw.alt : "",
      correctTargetIds: Array.isArray(raw.correctTargetIds)
        ? raw.correctTargetIds.filter((id): id is string => typeof id === "string")
        : [],
    };
  }
  return {
    kind: kind === "mcq" ? "mcq" : undefined,
    ...base,
    choices: Array.isArray(raw.choices)
      ? raw.choices.filter((c): c is string => typeof c === "string")
      : [],
    answer: typeof raw.answer === "string" ? raw.answer : "",
  };
}

export function parseCourseDescriptorInput(input: unknown): LessonkitCourseDescriptor | null {
  if (!isRecord(input)) return null;

  const trackingRaw = input.tracking;
  let tracking: LessonkitCourseDescriptor["tracking"];
  if (isRecord(trackingRaw)) {
    const completionRaw = trackingRaw.completion;
    const xapiRaw = trackingRaw.xapi;
    tracking = {
      completion: isRecord(completionRaw)
        ? {
            threshold:
              typeof completionRaw.threshold === "number" ? completionRaw.threshold : undefined,
          }
        : undefined,
      xapi: isRecord(xapiRaw)
        ? {
            activityIri:
              typeof xapiRaw.activityIri === "string" ? xapiRaw.activityIri : undefined,
          }
        : undefined,
    };
  }

  const themeRaw = input.theme;
  let theme: LessonkitCourseDescriptor["theme"];
  if (isRecord(themeRaw)) {
    theme = {
      preset:
        typeof themeRaw.preset === "string"
          ? (themeRaw.preset as ThemePresetName)
          : undefined,
    };
    if (isRecord(themeRaw.theme)) {
      theme.theme = themeRaw.theme as import("@lessonkit/themes").LessonkitThemeV1;
    }
  }

  return {
    courseId: typeof input.courseId === "string" ? input.courseId : "",
    title: typeof input.title === "string" ? input.title : "",
    version: typeof input.version === "string" ? input.version : undefined,
    layout: (typeof input.layout === "string" ? input.layout : undefined) as SpaLayout,
    lessons: Array.isArray(input.lessons) ? input.lessons.map(parseLessonDescriptor) : [],
    assessments: Array.isArray(input.assessments)
      ? input.assessments.map(parseAssessmentDescriptor)
      : undefined,
    theme,
    tracking,
    spaDistDir: typeof input.spaDistDir === "string" ? input.spaDistDir : undefined,
    spaLessonId: typeof input.spaLessonId === "string" ? input.spaLessonId : undefined,
  };
}
