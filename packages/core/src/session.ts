import type { CourseId } from "./identityTypes";
import { createSessionId } from "./ids";
import type { StoragePort } from "./ports";

export const SESSION_STORAGE_KEY = "lessonkit:sessionId";

const volatileSessionIds = new WeakMap<StoragePort, string>();
/** Shared volatile session id when durable sessionStorage writes fail (one id per tab). */
let sharedVolatileSessionId: string | null = null;

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

export function getTabSessionId(storage: StoragePort): string | null {
  return storage.getItem(SESSION_STORAGE_KEY);
}

const COURSE_STARTED_PREFIX = "lessonkit:course_started:";
const COURSE_STARTED_TRACKING_PREFIX = "lessonkit:course_started_tracking:";
const COURSE_STARTED_PIPELINE_PREFIX = "lessonkit:course_started_pipeline:";

export function resolveSessionId(storage: StoragePort, provided?: string): string {
  if (provided !== undefined) {
    const trimmed = provided.trim();
    if (trimmed.length > 0) return trimmed;
  }
  const existing = storage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const volatile = volatileSessionIds.get(storage);
  if (volatile) return volatile;
  const id = createSessionId();
  const persisted = storage.setItem(SESSION_STORAGE_KEY, id);
  if (!persisted) {
    if (!sharedVolatileSessionId) {
      sharedVolatileSessionId = id;
    }
    volatileSessionIds.set(storage, sharedVolatileSessionId);
    if (isDevEnvironment()) {
      console.warn(
        "[lessonkit] session id could not be persisted; reusing in-memory id for this tab.",
      );
    }
    return sharedVolatileSessionId;
  }
  return id;
}

function courseStartedStorageKey(sessionId: string, courseId?: CourseId): string {
  /* v8 ignore start -- callers guard undefined courseId before building keys */
  return `${COURSE_STARTED_PREFIX}${sessionId}:${courseId ?? ""}`;
  /* v8 ignore stop */
}

function courseStartedTrackingStorageKey(sessionId: string, courseId?: CourseId): string {
  /* v8 ignore start -- callers guard undefined courseId before building keys */
  return `${COURSE_STARTED_TRACKING_PREFIX}${sessionId}:${courseId ?? ""}`;
  /* v8 ignore stop */
}

function courseStartedPipelineStorageKey(sessionId: string, courseId?: CourseId): string {
  /* v8 ignore start -- callers guard undefined courseId before building keys */
  return `${COURSE_STARTED_PIPELINE_PREFIX}${sessionId}:${courseId ?? ""}`;
  /* v8 ignore stop */
}

export function hasCourseStarted(storage: StoragePort, sessionId: string, courseId?: CourseId): boolean {
  if (!courseId) return false;
  return storage.getItem(courseStartedStorageKey(sessionId, courseId)) === "1";
}

export function markCourseStarted(
  storage: StoragePort,
  sessionId: string,
  courseId?: CourseId,
): boolean {
  if (!courseId) return false;
  return storage.setItem(courseStartedStorageKey(sessionId, courseId), "1");
}

export function hasCourseStartedEmittedToTracking(
  storage: StoragePort,
  sessionId: string,
  courseId?: CourseId,
): boolean {
  if (!courseId) return false;
  return storage.getItem(courseStartedTrackingStorageKey(sessionId, courseId)) === "1";
}

export function markCourseStartedEmittedToTracking(
  storage: StoragePort,
  sessionId: string,
  courseId?: CourseId,
): void {
  if (!courseId) return;
  storage.setItem(courseStartedTrackingStorageKey(sessionId, courseId), "1");
}

export function hasCourseStartedPipelineDelivered(
  storage: StoragePort,
  sessionId: string,
  courseId?: CourseId,
): boolean {
  if (!courseId) return false;
  return storage.getItem(courseStartedPipelineStorageKey(sessionId, courseId)) === "1";
}

export function markCourseStartedPipelineDelivered(
  storage: StoragePort,
  sessionId: string,
  courseId?: CourseId,
): void {
  if (!courseId) return;
  storage.setItem(courseStartedPipelineStorageKey(sessionId, courseId), "1");
}

/** @internal Reset shared volatile session id between tests. */
export function resetSharedVolatileSessionIdForTests(): void {
  sharedVolatileSessionId = null;
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
  if (hasCourseStartedEmittedToTracking(storage, fromSessionId, courseId)) {
    markCourseStartedEmittedToTracking(storage, toSessionId, courseId);
    storage.removeItem?.(courseStartedTrackingStorageKey(fromSessionId, courseId));
  }
  if (hasCourseStartedPipelineDelivered(storage, fromSessionId, courseId)) {
    markCourseStartedPipelineDelivered(storage, toSessionId, courseId);
    storage.removeItem?.(courseStartedPipelineStorageKey(fromSessionId, courseId));
  }
}
