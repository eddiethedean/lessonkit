import type {
  BlockId,
  CheckId,
  CourseId,
  IdentityIdPath,
  LessonId,
} from "@lessonkit/core";
import { assertValidId } from "@lessonkit/core";

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

export function normalizeComponentId(id: unknown, path: "courseId"): CourseId;
export function normalizeComponentId(id: unknown, path: "lessonId"): LessonId;
export function normalizeComponentId(id: unknown, path: "checkId"): CheckId;
export function normalizeComponentId(id: unknown, path: "blockId"): BlockId;
export function normalizeComponentId(id: unknown, path: IdentityIdPath | string): string;
export function normalizeComponentId(id: unknown, path: IdentityIdPath | string): string {
  if (path === "courseId") return assertValidId(id, "courseId");
  if (path === "lessonId") return assertValidId(id, "lessonId");
  if (path === "checkId") return assertValidId(id, "checkId");
  if (path === "blockId") return assertValidId(id, "blockId");
  return assertValidId(id, path);
}

export { isDevEnvironment };
