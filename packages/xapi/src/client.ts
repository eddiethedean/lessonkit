import { nowIso } from "@lessonkit/core";
import type { XAPIClient, XAPIQueue, XAPIStatement, XAPITransport } from "./types";
import { createInMemoryXAPIQueue } from "./queue";
import { cryptoRandomId } from "./id";
import { formatDurationMs } from "./duration";

const XAPIVerbs = {
  started: "http://adlnet.gov/expapi/verbs/initialized",
  completed: "http://adlnet.gov/expapi/verbs/completed",
} as const;

export function createXAPIClient(opts?: {
  transport?: XAPITransport;
  baseId?: string;
  queue?: XAPIQueue;
}): XAPIClient {
  const transport = opts?.transport;
  const baseId = opts?.baseId ?? "urn:lessonkit";
  const queue = opts?.queue ?? createInMemoryXAPIQueue();

  const sendOrQueue = (statement: XAPIStatement) => {
    if (!transport) {
      queue.enqueue(statement);
      return;
    }
    void Promise.resolve()
      .then(() => transport(statement))
      .catch(() => {
        queue.enqueue(statement);
      });
  };

  return {
    send: (statement) => {
      sendOrQueue(statement);
    },
    queueSize: () => queue.size(),
    flush: async () => {
      if (!transport) return;
      await queue.flush(transport);
    },
    startedLesson: ({ lessonId }) => {
      const statement = statementFor(`${baseId}:lesson:${lessonId}`, XAPIVerbs.started);
      sendOrQueue(statement);
    },
    completeLesson: ({ lessonId, durationMs, score, maxScore, success }) => {
      const result: Record<string, unknown> = {};
      if (typeof durationMs === "number") result.duration = formatDurationMs(durationMs);
      if (typeof success === "boolean") result.success = success;
      if (typeof score === "number" || typeof maxScore === "number") {
        const max = typeof maxScore === "number" ? maxScore : undefined;
        const raw = typeof score === "number" ? score : undefined;
        result.score = {
          raw,
          max,
          min: 0,
          scaled: typeof raw === "number" && typeof max === "number" && max > 0 ? raw / max : undefined,
        };
      }
      const statement = statementFor(`${baseId}:lesson:${lessonId}`, XAPIVerbs.completed, {
        result: Object.keys(result).length ? result : undefined,
      });
      sendOrQueue(statement);
    },
    completeCourse: () => {
      const statement = statementFor(`${baseId}:course`, XAPIVerbs.completed);
      sendOrQueue(statement);
    },
  };
}

function statementFor(
  objectId: string,
  verb: string,
  extra?: Pick<XAPIStatement, "result" | "context">,
): XAPIStatement {
  return {
    id: cryptoRandomId(),
    timestamp: nowIso(),
    verb,
    object: { id: objectId },
    result: extra?.result,
    context: extra?.context,
  };
}

