import type {
  AssessmentHandle,
  AssessmentResumeState,
  AssessmentXAPIData,
  CheckId,
} from "@lessonkit/core";

export type BuildAssessmentHandleOpts = {
  checkId: CheckId;
  getScore: () => number;
  getMaxScore: () => number;
  getAnswerGiven: () => boolean;
  resetTask: () => void;
  showSolutions: () => void;
  getXAPIData: () => AssessmentXAPIData;
  /**
   * Snapshot for compound sessionStorage resume. When provided, the handle identity must
   * change whenever this snapshot would change (or call persistence explicitly on navigation).
   */
  getCurrentState?: () => AssessmentResumeState;
  resume?: (state: AssessmentResumeState) => void;
};

/** Builds a consistent {@link AssessmentHandle} for scored blocks. */
export function buildAssessmentHandle(opts: BuildAssessmentHandleOpts): AssessmentHandle {
  return {
    getScore: opts.getScore,
    getMaxScore: opts.getMaxScore,
    getAnswerGiven: opts.getAnswerGiven,
    resetTask: opts.resetTask,
    showSolutions: opts.showSolutions,
    getXAPIData: opts.getXAPIData,
    ...(opts.getCurrentState ? { getCurrentState: opts.getCurrentState } : {}),
    ...(opts.resume ? { resume: opts.resume } : {}),
  };
};
