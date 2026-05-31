export type CourseId = string;
export type LessonId = string;
export type CheckId = string;
export type BlockId = string;

/** Stable URN string returned by {@link buildLessonkitUrn}. */
export type LessonkitUrn = string;

export type IdentityValidationIssue = {
  path: string;
  message: string;
};

export type IdentityValidationResult =
  | { ok: true; id: string }
  | { ok: false; issues: IdentityValidationIssue[] };

export type IdentityIdPath = "courseId" | "lessonId" | "checkId" | "blockId" | "id";

/** LessonKit id format: letter first, then alphanumeric, `_`, `-`; length 1–64. */
export const ID_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;

export const ID_MAX_LENGTH = 64;
