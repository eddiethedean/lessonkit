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

export type XAPIQueue = {
  enqueue: (statement: XAPIStatement) => void;
  flush: (transport: XAPITransport) => Promise<void>;
  size: () => number;
};

export function createInMemoryXAPIQueue(): XAPIQueue {
  const buffer: XAPIStatement[] = [];
  return {
    enqueue: (statement) => {
      buffer.push(statement);
    },
    size: () => buffer.length,
    flush: async (transport) => {
      // Drain sequentially so transports that depend on ordering behave predictably.
      while (buffer.length) {
        const statement = buffer[0]!;
        try {
          await transport(statement);
          buffer.shift();
        } catch {
          // Stop flushing on first error; keep remainder queued.
          return;
        }
      }
    },
  };
}

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

function cryptoRandomId(): string {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function formatDurationMs(ms: number): string {
  const safe = Math.max(0, ms);
  // xAPI expects ISO 8601 duration. Use seconds with millisecond precision.
  const seconds = safe / 1000;
  const fixed = Number.isInteger(seconds) ? String(seconds) : seconds.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  return `PT${fixed}S`;
}

