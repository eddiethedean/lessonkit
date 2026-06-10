import type { CourseId } from "./identityTypes";
import { createSessionId } from "./ids";
import type { StoragePort } from "./ports";
import { validateId } from "./validateId";

export const SESSION_STORAGE_KEY = "lessonkit:sessionId";

const volatileSessionIds = new WeakMap<StoragePort, string>();

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

export type InvalidSessionIdContext = {
  /** The invalid id that was rejected. */
  invalidId: string;
  /** Id actually used after fallback. */
  fallbackId: string;
  /** Whether the invalid id came from config or from stored tab state. */
  source: "provided" | "stored";
};

export type ResolveSessionIdOptions = {
  /** Invoked when an invalid session id is replaced by a tab or generated id. */
  onInvalidSessionId?: (ctx: InvalidSessionIdContext) => void;
};

export function getTabSessionId(storage: StoragePort): string | null {
  return storage.getItem(SESSION_STORAGE_KEY);
}

const COURSE_STARTED_PREFIX = "lessonkit:course_started:";
const COURSE_STARTED_TRACKING_PREFIX = "lessonkit:course_started_tracking:";
const COURSE_STARTED_PIPELINE_PREFIX = "lessonkit:course_started_pipeline:";
const COURSE_STARTED_XAPI_PREFIX = "lessonkit:course_started_xapi:";

/** Safe segment for composite storage keys (avoids colon ambiguity in sessionId). */
function sessionKeySegment(sessionId: string): string {
  const validated = validateId(sessionId);
  return validated.ok ? validated.id : encodeURIComponent(sessionId);
}

function resolveGeneratedSessionId(storage: StoragePort): string {
  const volatile = volatileSessionIds.get(storage);
  if (volatile) return volatile;
  const id = createSessionId();
  const persisted = storage.setItem(SESSION_STORAGE_KEY, id);
  if (!persisted) {
    volatileSessionIds.set(storage, id);
    if (isDevEnvironment()) {
      console.warn(
        "[lessonkit] session id could not be persisted; using in-memory id for this storage.",
      );
    }
    return id;
  }
  return id;
}

function resolveFallbackSessionId(
  storage: StoragePort,
  options?: ResolveSessionIdOptions,
): string {
  const existing = storage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    const trimmedExisting = existing.trim();
    const validatedExisting = validateId(trimmedExisting);
    if (validatedExisting.ok) return validatedExisting.id;
    storage.removeItem?.(SESSION_STORAGE_KEY);
    if (isDevEnvironment()) {
      console.warn(
        `[lessonkit] Invalid stored sessionId "${existing}"; generating a new id.`,
      );
    }
    const fallback = resolveGeneratedSessionId(storage);
    options?.onInvalidSessionId?.({
      invalidId: existing,
      fallbackId: fallback,
      source: "stored",
    });
    return fallback;
  }
  return resolveGeneratedSessionId(storage);
}

export function resolveSessionId(
  storage: StoragePort,
  provided?: string,
  options?: ResolveSessionIdOptions,
): string {
  if (provided !== undefined) {
    const trimmed = provided.trim();
    if (trimmed.length > 0) {
      const validated = validateId(trimmed);
      if (validated.ok) return validated.id;
      if (isDevEnvironment()) {
        console.warn(
          `[lessonkit] Invalid sessionId "${trimmed}"; falling back to tab or generated id.`,
        );
      }
      const fallback = resolveFallbackSessionId(storage, options);
      options?.onInvalidSessionId?.({
        invalidId: trimmed,
        fallbackId: fallback,
        source: "provided",
      });
      return fallback;
    }
  }
  return resolveFallbackSessionId(storage, options);
}

function courseStartedStorageKey(sessionId: string, courseId?: CourseId): string {
  /* v8 ignore start -- callers guard undefined courseId before building keys */
  return `${COURSE_STARTED_PREFIX}${sessionKeySegment(sessionId)}:${courseId ?? ""}`;
  /* v8 ignore stop */
}

function courseStartedTrackingStorageKey(sessionId: string, courseId?: CourseId): string {
  /* v8 ignore start -- callers guard undefined courseId before building keys */
  return `${COURSE_STARTED_TRACKING_PREFIX}${sessionKeySegment(sessionId)}:${courseId ?? ""}`;
  /* v8 ignore stop */
}

function courseStartedPipelineStorageKey(sessionId: string, courseId?: CourseId): string {
  /* v8 ignore start -- callers guard undefined courseId before building keys */
  return `${COURSE_STARTED_PIPELINE_PREFIX}${sessionKeySegment(sessionId)}:${courseId ?? ""}`;
  /* v8 ignore stop */
}

function courseStartedXapiStorageKey(sessionId: string, courseId?: CourseId): string {
  /* v8 ignore start -- callers guard undefined courseId before building keys */
  return `${COURSE_STARTED_XAPI_PREFIX}${sessionKeySegment(sessionId)}:${courseId ?? ""}`;
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
): boolean {
  if (!courseId) return false;
  return storage.setItem(courseStartedTrackingStorageKey(sessionId, courseId), "1");
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
): boolean {
  if (!courseId) return false;
  return storage.setItem(courseStartedPipelineStorageKey(sessionId, courseId), "1");
}

export function hasCourseStartedXapiSent(
  storage: StoragePort,
  sessionId: string,
  courseId?: CourseId,
): boolean {
  if (!courseId) return false;
  return storage.getItem(courseStartedXapiStorageKey(sessionId, courseId)) === "1";
}

export function markCourseStartedXapiSent(
  storage: StoragePort,
  sessionId: string,
  courseId?: CourseId,
): boolean {
  if (!courseId) return false;
  return storage.setItem(courseStartedXapiStorageKey(sessionId, courseId), "1");
}

/** @internal Reset volatile session ids between tests. */
export function resetSharedVolatileSessionIdForTests(): void {
  // WeakMap entries are scoped per StoragePort; no global state to reset.
}

function migrateStorageMark(
  storage: StoragePort,
  fromKey: string,
  toKey: string,
  hasMark: boolean,
): void {
  if (!hasMark) return;
  if (storage.setItem(toKey, "1")) {
    storage.removeItem?.(fromKey);
  }
}

export function migrateCourseStartedMark(
  storage: StoragePort,
  fromSessionId: string,
  toSessionId: string,
  courseId?: CourseId,
): void {
  if (!courseId || fromSessionId === toSessionId) return;
  migrateStorageMark(
    storage,
    courseStartedStorageKey(fromSessionId, courseId),
    courseStartedStorageKey(toSessionId, courseId),
    hasCourseStarted(storage, fromSessionId, courseId),
  );
  migrateStorageMark(
    storage,
    courseStartedTrackingStorageKey(fromSessionId, courseId),
    courseStartedTrackingStorageKey(toSessionId, courseId),
    hasCourseStartedEmittedToTracking(storage, fromSessionId, courseId),
  );
  migrateStorageMark(
    storage,
    courseStartedPipelineStorageKey(fromSessionId, courseId),
    courseStartedPipelineStorageKey(toSessionId, courseId),
    hasCourseStartedPipelineDelivered(storage, fromSessionId, courseId),
  );
  migrateStorageMark(
    storage,
    courseStartedXapiStorageKey(fromSessionId, courseId),
    courseStartedXapiStorageKey(toSessionId, courseId),
    hasCourseStartedXapiSent(storage, fromSessionId, courseId),
  );
}
