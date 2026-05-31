import {
  ID_MAX_LENGTH,
  ID_PATTERN,
  type BlockId,
  type CheckId,
  type CourseId,
  type IdentityIdPath,
  type IdentityValidationResult,
  type LessonId,
} from "./identityTypes";

export function validateId(input: unknown, path: IdentityIdPath | string = "id"): IdentityValidationResult {
  if (typeof input !== "string") {
    return { ok: false, issues: [{ path, message: "id must be a string" }] };
  }
  const id = input.trim();
  if (!id.length) {
    return { ok: false, issues: [{ path, message: "id must not be empty" }] };
  }
  if (id.length > ID_MAX_LENGTH) {
    return {
      ok: false,
      issues: [{ path, message: `id must be at most ${ID_MAX_LENGTH} characters` }],
    };
  }
  if (!ID_PATTERN.test(id)) {
    return {
      ok: false,
      issues: [
        {
          path,
          message:
            "id must start with a letter and contain only letters, digits, underscores, and hyphens",
        },
      ],
    };
  }
  return { ok: true, id };
}

export function parseCourseId(input: unknown): CourseId | null {
  const result = validateId(input, "courseId");
  return result.ok ? (result.id as CourseId) : null;
}

export function parseLessonId(input: unknown): LessonId | null {
  const result = validateId(input, "lessonId");
  return result.ok ? (result.id as LessonId) : null;
}

export function parseCheckId(input: unknown): CheckId | null {
  const result = validateId(input, "checkId");
  return result.ok ? (result.id as CheckId) : null;
}

export function parseBlockId(input: unknown): BlockId | null {
  const result = validateId(input, "blockId");
  return result.ok ? (result.id as BlockId) : null;
}

export function assertValidId(input: unknown, path: "courseId"): CourseId;
export function assertValidId(input: unknown, path: "lessonId"): LessonId;
export function assertValidId(input: unknown, path: "checkId"): CheckId;
export function assertValidId(input: unknown, path: "blockId"): BlockId;
export function assertValidId(input: unknown, path?: IdentityIdPath | string): string;
export function assertValidId(input: unknown, path: IdentityIdPath | string = "id"): string {
  const result = validateId(input, path);
  if (!result.ok) {
    throw new Error(result.issues.map((i) => `${i.path}: ${i.message}`).join("; "));
  }
  return result.id;
}
