import type { LessonId } from "@lessonkit/core";
import { nowIso } from "@lessonkit/core";

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

export type XAPIClient = {
  send: (statement: XAPIStatement) => void;
  completeLesson: (opts: { lessonId: LessonId }) => void;
  startedLesson: (opts: { lessonId: LessonId }) => void;
  completeCourse: (opts: {}) => void;
};

export function createXAPIClient(opts?: { transport?: XAPITransport; baseId?: string }): XAPIClient {
  const transport = opts?.transport;
  const baseId = opts?.baseId ?? "urn:lessonkit";
  return {
    send: (statement) => {
      void transport?.(statement);
    },
    startedLesson: ({ lessonId }) => {
      const statement = statementFor(`${baseId}:lesson:${lessonId}`, "started");
      void transport?.(statement);
    },
    completeLesson: ({ lessonId }) => {
      const statement = statementFor(`${baseId}:lesson:${lessonId}`, "completed");
      void transport?.(statement);
    },
    completeCourse: () => {
      const statement = statementFor(`${baseId}:course`, "completed");
      void transport?.(statement);
    },
  };
}

function statementFor(objectId: string, verb: string): XAPIStatement {
  return {
    id: cryptoRandomId(),
    timestamp: nowIso(),
    verb,
    object: { id: objectId },
  };
}

function cryptoRandomId(): string {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return Math.random().toString(16).slice(2);
}

