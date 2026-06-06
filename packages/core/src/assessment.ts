import type { CheckId } from "./identityTypes";

/** H5P-aligned interaction kinds for assessment telemetry and xAPI. */
export type AssessmentInteractionType =
  | "mcq"
  | "trueFalse"
  | "fillInBlanks"
  | "markTheWords"
  | "dragTheWords"
  | "dragAndDrop"
  | "assessmentSequence"
  | "findHotspot"
  | "findMultipleHotspots"
  | "summary"
  | "imagePairing"
  | "imageSequencing"
  | "essay"
  | "arithmeticQuiz"
  | "memoryGame";

/** Serializable resume blob for a single assessment block. */
export type AssessmentResumeState = Record<string, unknown>;

/** Behaviour flags aligned with H5P question types. */
export type AssessmentBehaviour = {
  enableRetry?: boolean;
  enableSolutionsButton?: boolean;
  autoCheck?: boolean;
};

/** Payload for xAPI mapping from assessment components. */
export type AssessmentXAPIData = {
  checkId: CheckId;
  interactionType: AssessmentInteractionType;
  response?: string | string[] | boolean | Record<string, unknown>;
  correct?: boolean;
  score?: number;
  maxScore?: number;
};

/**
 * Imperative handle for scored blocks (H5P question-type contract analogue).
 * Parent containers (`AssessmentSequence`, future compounds) may call these methods.
 */
export type AssessmentHandle = {
  getScore: () => number;
  getMaxScore: () => number;
  getAnswerGiven: () => boolean;
  resetTask: () => void;
  showSolutions: () => void;
  getXAPIData: () => AssessmentXAPIData;
  getCurrentState?: () => AssessmentResumeState;
  resume?: (state: AssessmentResumeState) => void;
};

export type AssessmentBaseProps = AssessmentBehaviour & {
  checkId: CheckId;
  passingScore?: number;
};

/** MCQ assessment props shared by React components and LMS packaging descriptors. */
export type McqAssessmentProps = AssessmentBaseProps & {
  kind?: "mcq";
  question: string;
  choices: string[];
  answer: string;
};
