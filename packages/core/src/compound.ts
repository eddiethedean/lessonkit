import type { BlockId, CheckId } from "./identityTypes";
import type { AssessmentResumeState } from "./assessment";

export const COMPOUND_RESUME_SCHEMA_VERSION = 1 as const;

/** Serializable resume blob for a compound container (InteractiveBook, AssessmentSequence, …). */
export type CompoundResumeState = {
  schemaVersion: typeof COMPOUND_RESUME_SCHEMA_VERSION;
  activePageIndex: number;
  /** Optional chapter index when nested inside InteractiveBook. */
  activeChapterIndex?: number;
  childStates: Record<string, AssessmentResumeState>;
};

export type CompoundResumeInput = {
  activePageIndex?: number;
  activeChapterIndex?: number;
  childStates?: Record<CheckId, AssessmentResumeState>;
};

export function createCompoundResumeState(input: CompoundResumeInput = {}): CompoundResumeState {
  const childStates: Record<string, AssessmentResumeState> = {};
  if (input.childStates) {
    for (const [key, value] of Object.entries(input.childStates)) {
      childStates[key] = value;
    }
  }
  return {
    schemaVersion: COMPOUND_RESUME_SCHEMA_VERSION,
    activePageIndex: input.activePageIndex ?? 0,
    ...(input.activeChapterIndex !== undefined ? { activeChapterIndex: input.activeChapterIndex } : {}),
    childStates,
  };
}

export function parseCompoundResumeState(raw: unknown): CompoundResumeState | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.schemaVersion !== COMPOUND_RESUME_SCHEMA_VERSION) return null;
  if (typeof obj.activePageIndex !== "number" || !Number.isFinite(obj.activePageIndex)) return null;
  const childStates =
    obj.childStates && typeof obj.childStates === "object" && !Array.isArray(obj.childStates)
      ? (obj.childStates as Record<string, AssessmentResumeState>)
      : {};
  const activeChapterIndex =
    typeof obj.activeChapterIndex === "number" && Number.isFinite(obj.activeChapterIndex)
      ? obj.activeChapterIndex
      : undefined;
  return {
    schemaVersion: COMPOUND_RESUME_SCHEMA_VERSION,
    activePageIndex: Math.max(0, Math.floor(obj.activePageIndex)),
    ...(activeChapterIndex !== undefined ? { activeChapterIndex: Math.max(0, Math.floor(activeChapterIndex)) } : {}),
    childStates,
  };
}

/**
 * Imperative handle for compound containers (H5P compound analogue).
 * Parents aggregate child AssessmentHandle scores and persist navigation state.
 */
export type CompoundHandle = {
  getScore: () => number;
  getMaxScore: () => number;
  getAnswerGiven: () => boolean;
  resetTask: () => void;
  showSolutions: () => void;
  getCurrentState: () => CompoundResumeState;
  resume: (state: CompoundResumeState) => void;
};

export type CompoundBaseProps = {
  blockId: BlockId;
};
