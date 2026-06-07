import type { CourseId } from "./identityTypes";
import type { BlockId } from "./identityTypes";
import {
  parseCompoundResumeState,
  type CompoundResumeState,
  type ParseCompoundResumeStateOptions,
} from "./compound";
import { isDevEnvironment } from "./internal/env";
import type { StoragePort } from "./ports";

const COMPOUND_STATE_PREFIX = "lessonkit:compound:";

export function compoundStateStorageKey(courseId: CourseId, compoundId: BlockId): string {
  return `${COMPOUND_STATE_PREFIX}${courseId}:${compoundId}`;
}

export type LoadCompoundStateOptions = ParseCompoundResumeStateOptions & {
  onCorrupt?: () => void;
};

export function loadCompoundState(
  storage: StoragePort,
  courseId: CourseId,
  compoundId: BlockId,
  opts?: LoadCompoundStateOptions,
): CompoundResumeState | null {
  const key = compoundStateStorageKey(courseId, compoundId);
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = parseCompoundResumeState(JSON.parse(raw) as unknown, opts);
    if (parsed === null) {
      opts?.onCorrupt?.();
      if (isDevEnvironment()) {
        console.warn(`[lessonkit] Ignoring corrupt compound resume state at ${key}`);
      }
    }
    return parsed;
  } catch {
    opts?.onCorrupt?.();
    if (isDevEnvironment()) {
      console.warn(`[lessonkit] Ignoring corrupt compound resume state at ${key}`);
    }
    return null;
  }
}

export function saveCompoundState(
  storage: StoragePort,
  courseId: CourseId,
  compoundId: BlockId,
  state: CompoundResumeState,
): boolean {
  return storage.setItem(compoundStateStorageKey(courseId, compoundId), JSON.stringify(state));
}

export function clearCompoundState(
  storage: StoragePort,
  courseId: CourseId,
  compoundId: BlockId,
): void {
  storage.removeItem?.(compoundStateStorageKey(courseId, compoundId));
}
