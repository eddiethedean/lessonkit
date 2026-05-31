import type { LessonId } from "@lessonkit/core";

export type XAPIVerbIri =
  | "http://adlnet.gov/expapi/verbs/initialized"
  | "http://adlnet.gov/expapi/verbs/completed"
  | "http://adlnet.gov/expapi/verbs/answered"
  | "http://adlnet.gov/expapi/verbs/experienced";

export type XAPIScore = {
  raw?: number;
  max?: number;
  min?: number;
  scaled?: number;
};

export type XAPIResult = {
  duration?: string;
  success?: boolean;
  score?: XAPIScore;
  completion?: boolean;
};

export type XAPIObjectDefinition = {
  name?: Record<string, string>;
  description?: Record<string, string>;
  type?: string;
};

export type XAPIStatement = {
  id: string;
  timestamp: string;
  verb: XAPIVerbIri;
  object: {
    id: string;
    definition?: XAPIObjectDefinition;
  };
  result?: XAPIResult;
  context?: Record<string, unknown>;
};

export type XAPITransport = (statement: XAPIStatement) => void | Promise<void>;

export type XAPIQueue = {
  enqueue: (statement: XAPIStatement) => void;
  flush: (transport: XAPITransport) => Promise<void>;
  size: () => number;
};

export type XAPIClient = {
  send: (statement: XAPIStatement) => void;
  flush: () => Promise<void>;
  queueSize: () => number;
  startedLesson: (opts: { lessonId: LessonId }) => void;
  completeLesson: (opts: {
    lessonId: LessonId;
    durationMs?: number;
    success?: boolean;
    score?: number;
    maxScore?: number;
  }) => void;
  completeCourse: () => void;
};
