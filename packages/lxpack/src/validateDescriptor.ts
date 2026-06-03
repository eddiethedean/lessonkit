import { validateId } from "@lessonkit/core";
import type { ExportTarget } from "@lxpack/api";
import type { LessonkitThemeV1, ThemePresetName } from "@lessonkit/themes";
import type {
  AssessmentDescriptor,
  LessonDescriptor,
  LessonkitCourseDescriptor,
  McqAssessmentDescriptor,
  SpaLayout,
} from "./types";
import { isSafeRelativeSpaPath } from "./spaPath";
import { themeToLxpackRuntime } from "./theme";
import type { ValidationIssue } from "./validationIssue";

const VALID_LAYOUTS: readonly SpaLayout[] = ["single-spa", "per-lesson-spa"];
const VALID_THEME_PRESETS = ["default", "light", "dark", "brand"] as const satisfies readonly ThemePresetName[];

export type DescriptorValidationIssue = ValidationIssue;

export type DescriptorValidationResult =
  | { ok: true; descriptor: LessonkitCourseDescriptor }
  | { ok: false; issues: DescriptorValidationIssue[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseLessonDescriptor(raw: unknown): LessonDescriptor {
  if (!isRecord(raw)) {
    return { id: "", title: "" };
  }
  return {
    id: typeof raw.id === "string" ? raw.id : "",
    title: typeof raw.title === "string" ? raw.title : "",
    spaPath: typeof raw.spaPath === "string" ? raw.spaPath : undefined,
  };
}

function parseAssessmentDescriptor(raw: unknown): AssessmentDescriptor {
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

function parseCourseDescriptorInput(input: unknown): LessonkitCourseDescriptor | null {
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
      theme.theme = themeRaw.theme as LessonkitThemeV1;
    }
  }

  /* v8 ignore start */
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
  /* v8 ignore stop */
}

function normalizeDescriptor(input: LessonkitCourseDescriptor): LessonkitCourseDescriptor {
  /* v8 ignore start */
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
      /* v8 ignore next */
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
      /* v8 ignore next */
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
  /* v8 ignore stop */
}

export function validateDescriptor(input: unknown): DescriptorValidationResult {
  const parsed = parseCourseDescriptorInput(input);
  if (parsed === null) {
    return { ok: false, issues: [{ path: "course", message: "must be an object" }] };
  }
  return validateDescriptorParsed(parsed);
}

export function validateDescriptorForTarget(
  input: unknown,
  target?: ExportTarget,
): DescriptorValidationResult {
  const result = validateDescriptor(input);
  if (!result.ok || !target) return result;
  if (target !== "xapi" && target !== "cmi5") return result;

  const activityIri = result.descriptor.tracking?.xapi?.activityIri?.trim();
  if (!activityIri) {
    return {
      ok: false,
      issues: [
        {
          path: "course.tracking.xapi.activityIri",
          message: "tracking.xapi.activityIri is required for xapi and cmi5 export targets",
        },
      ],
    };
  }
  return result;
}

function validateDescriptorParsed(input: LessonkitCourseDescriptor): DescriptorValidationResult {
  /* v8 ignore start */
  const issues: DescriptorValidationIssue[] = [];

  const course = validateId(input.courseId, "courseId");
  if (!course.ok) issues.push(...course.issues.map((i) => ({ path: i.path, message: i.message })));

  if (!input.title?.trim()) {
    issues.push({ path: "title", message: "title is required" });
  }

  if (!input.lessons?.length) {
    issues.push({ path: "lessons", message: "at least one lesson is required" });
  }

  if (!input.layout) {
    issues.push({ path: "layout", message: "layout is required" });
  } else if (!VALID_LAYOUTS.includes(input.layout)) {
    issues.push({
      path: "layout",
      message: `layout must be one of: ${VALID_LAYOUTS.join(", ")}`,
    });
  }

  const layout = input.layout;
  const themePreset = input.theme?.preset;
  if (themePreset !== undefined && !VALID_THEME_PRESETS.includes(themePreset)) {
    issues.push({
      path: "theme.preset",
      message: `unknown preset; use one of: ${VALID_THEME_PRESETS.join(", ")}`,
    });
  }

  if (input.theme?.theme) {
    try {
      themeToLxpackRuntime({ preset: themePreset, theme: input.theme.theme });
    } catch (err) {
      issues.push({
        path: "theme.theme",
        message: err instanceof Error ? err.message : "invalid custom theme",
      });
    }
  }

  const completionThreshold = input.tracking?.completion?.threshold;
  if (completionThreshold !== undefined) {
    if (
      !Number.isFinite(completionThreshold) ||
      completionThreshold < 0 ||
      completionThreshold > 1
    ) {
      issues.push({
        path: "tracking.completion.threshold",
        message: "threshold must be a finite number between 0 and 1",
      });
    }
  }

  if (layout === "single-spa" && (input.lessons?.length ?? 0) > 1) {
    issues.push({
      path: "lessons",
      message:
        "single-spa layout packages one SPA lesson; remove extra lesson entries or use per-lesson-spa",
    });
  }

  const lessonIds = new Set<string>();
  const spaPaths = new Set<string>();
  for (const [index, lesson] of (input.lessons ?? []).entries()) {
    const path = `lessons[${index}]`;
    const lessonResult = validateId(lesson.id, `${path}.id`);
    if (!lessonResult.ok) {
      issues.push(...lessonResult.issues.map((i) => ({ path: i.path, message: i.message })));
    } else if (lessonIds.has(lessonResult.id)) {
      issues.push({ path: `${path}.id`, message: "duplicate lesson id" });
    } else {
      lessonIds.add(lessonResult.id);
    }
    if (!lesson.title?.trim()) {
      issues.push({ path: `${path}.title`, message: "lesson title is required" });
    }
    if (layout === "per-lesson-spa") {
      const spaPath = lesson.spaPath?.trim();
      if (!spaPath) {
        issues.push({
          path: `${path}.spaPath`,
          message: "spaPath is required for per-lesson-spa layout",
        });
      } else if (!isSafeRelativeSpaPath(spaPath)) {
        issues.push({
          path: `${path}.spaPath`,
          message:
            "spaPath must be a relative path without '..' segments or absolute prefixes",
        });
      } else if (spaPaths.has(spaPath)) {
        issues.push({ path: `${path}.spaPath`, message: "duplicate spaPath" });
      } else {
        spaPaths.add(spaPath);
      }
    }
  }

  if (layout === "single-spa" && input.spaLessonId?.trim()) {
    const spaId = input.spaLessonId.trim();
    const spaResult = validateId(spaId, "spaLessonId");
    if (!spaResult.ok) {
      issues.push(...spaResult.issues.map((i) => ({ path: i.path, message: i.message })));
    } else if (!lessonIds.has(spaResult.id)) {
      issues.push({
        path: "spaLessonId",
        message: "spaLessonId must match a lesson id in lessons",
      });
    }
  }

  const checkIds = new Set<string>();
  for (const [index, assessment] of (input.assessments ?? []).entries()) {
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
    const kind = assessment.kind ?? "mcq";
    if (kind === "trueFalse" && assessment.kind === "trueFalse") {
      if (typeof assessment.answer !== "boolean") {
        issues.push({ path: `${path}.answer`, message: "answer must be a boolean for trueFalse" });
      }
    } else if (kind === "fillInBlanks" && assessment.kind === "fillInBlanks") {
      if (!assessment.template?.trim()) {
        issues.push({ path: `${path}.template`, message: "template is required for fillInBlanks" });
      }
    } else if ("choices" in assessment && "answer" in assessment && typeof assessment.answer === "string") {
      const trimmedChoices = assessment.choices.map((c: string) => c.trim()).filter((c: string) => c.length > 0);
      if (!trimmedChoices.length) {
        issues.push({
          path: `${path}.choices`,
          message: "at least one non-empty choice is required",
        });
      }
      if (!assessment.answer.trim()) {
        issues.push({ path: `${path}.answer`, message: "answer is required" });
      } else if (trimmedChoices.length && !trimmedChoices.includes(assessment.answer.trim())) {
        issues.push({ path: `${path}.answer`, message: "answer must match a choice" });
      }
    }
    const passingScore = assessment.passingScore;
    if (passingScore !== undefined && !(Number.isFinite(passingScore) && passingScore > 0)) {
      issues.push({
        path: `${path}.passingScore`,
        message: "passingScore must be greater than 0 (absolute point threshold)",
      });
    }
  }

  if (issues.length) return { ok: false, issues };
  /* v8 ignore stop */
  return { ok: true, descriptor: normalizeDescriptor(input) };
}
