import type { CourseId } from "./identityTypes";
import type { BlockId } from "./identityTypes";
import { parseCompoundResumeState, type CompoundResumeState } from "./compound";
import type { StoragePort } from "./ports";

const COMPOUND_STATE_PREFIX = "lessonkit:compound:";

export function compoundStateStorageKey(courseId: CourseId, compoundId: BlockId): string {
  return `${COMPOUND_STATE_PREFIX}${courseId}:${compoundId}`;
}

export function loadCompoundState(
  storage: StoragePort,
  courseId: CourseId,
  compoundId: BlockId,
): CompoundResumeState | null {
  const raw = storage.getItem(compoundStateStorageKey(courseId, compoundId));
  if (!raw) return null;
  try {
    return parseCompoundResumeState(JSON.parse(raw) as unknown);
  } catch {
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
