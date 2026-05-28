import type { LessonId } from "@lessonkit/core";

export type XAPIStatement = {
  id: string;
  timestamp: string;
  verb: string;
  object: {
    id: string;
    definition?: Record<string, unknown>;
  };
  result?: Record<string, unknown>;
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

