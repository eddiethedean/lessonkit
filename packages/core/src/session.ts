import type { CourseId } from "./identityTypes";
import { createSessionId } from "./ids";
import type { StoragePort } from "./ports";

export const SESSION_STORAGE_KEY = "lessonkit:sessionId";

export function getTabSessionId(storage: StoragePort): string | null {
  return storage.getItem(SESSION_STORAGE_KEY);
}

const COURSE_STARTED_PREFIX = "lessonkit:course_started:";

export function resolveSessionId(storage: StoragePort, provided?: string): string {
  if (provided) return provided;
  const existing = storage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const id = createSessionId();
  storage.setItem(SESSION_STORAGE_KEY, id);
  return id;
}

function courseStartedStorageKey(sessionId: string, courseId?: CourseId): string {
  return `${COURSE_STARTED_PREFIX}${sessionId}:${courseId ?? ""}`;
}

export function hasCourseStarted(storage: StoragePort, sessionId: string, courseId?: CourseId): boolean {
  if (!courseId) return false;
  return storage.getItem(courseStartedStorageKey(sessionId, courseId)) === "1";
}

export function markCourseStarted(storage: StoragePort, sessionId: string, courseId?: CourseId): void {
  if (!courseId) return;
  storage.setItem(courseStartedStorageKey(sessionId, courseId), "1");
}

export function migrateCourseStartedMark(
  storage: StoragePort,
  fromSessionId: string,
  toSessionId: string,
  courseId?: CourseId,
): void {
  if (!courseId || fromSessionId === toSessionId) return;
  if (hasCourseStarted(storage, fromSessionId, courseId)) {
    markCourseStarted(storage, toSessionId, courseId);
    storage.removeItem?.(courseStartedStorageKey(fromSessionId, courseId));
  }
}
