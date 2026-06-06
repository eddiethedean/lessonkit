import type { CourseId, LessonId } from "@lessonkit/core";
import { nowIso } from "@lessonkit/core";
import type { XAPIClient, XAPIQueue, XAPIStatement, XAPITransport } from "./types";
import { cryptoRandomId } from "./id";
import { createInMemoryXAPIQueue } from "./queue";
import { telemetryEventToXAPIStatement } from "./telemetryMap";

function withStatementId(statement: XAPIStatement): XAPIStatement {
  const trimmed = statement.id?.trim();
  if (trimmed) {
    if (trimmed !== statement.id) statement.id = trimmed;
    return statement;
  }
  statement.id = cryptoRandomId();
  return statement;
}

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

export function createXAPIClient(opts?: {
  transport?: XAPITransport;
  /** Keepalive transport for pagehide flush (e.g. from createFetchTransport). */
  exitTransport?: import("./types").XAPIExitTransport;
  courseId?: CourseId;
  queue?: XAPIQueue;
  /** When creating the default in-memory queue (max size 1000 unless overridden). */
  maxQueueSize?: number;
  onQueueDepth?: (size: number) => void;
  onQueueCap?: () => void;
  /** Called when transport fails after retries (statement is re-queued). */
  onTransportError?: (err: unknown) => void;
}): XAPIClient {
  const transport = opts?.transport;
  const exitTransport = opts?.exitTransport;
  const courseId = opts?.courseId;
  const queue =
    opts?.queue ??
    createInMemoryXAPIQueue({
      maxSize: opts?.maxQueueSize,
      onDepth: opts?.onQueueDepth,
      onCap: opts?.onQueueCap,
    });
  let warnedNoTransport = false;
  let warnedTransportFailure = false;
  const inflightById = new Map<string, Promise<void>>();
  const inflightStatements = new Map<string, XAPIStatement>();

  const sendOrQueue = (statement: XAPIStatement) => {
    const normalized = withStatementId(statement);
    if (!transport) {
      queue.enqueue(normalized);
      if (isDevEnvironment() && !warnedNoTransport) {
        warnedNoTransport = true;
        console.warn(
          "[lessonkit] xAPI statements are queued but no transport is configured; pass config.xapi.transport or config.xapi.client",
        );
      }
      return;
    }
    const existing = inflightById.get(normalized.id);
    if (existing) {
      void existing.then(
        () => undefined,
        () => {
          sendOrQueue(normalized);
        },
      );
      return;
    }

    inflightStatements.set(normalized.id, normalized);
    const flight = Promise.resolve()
      .then(async () => {
        await transport(normalized);
        queue.removeById(normalized.id);
      })
      .catch((err) => {
        queue.enqueue(normalized);
        opts?.onTransportError?.(err);
        if (isDevEnvironment() && !warnedTransportFailure) {
          warnedTransportFailure = true;
          console.warn(
            "[lessonkit] xAPI transport failed; statement re-queued. Check your LRS endpoint or transport implementation.",
          );
        }
        throw new Error("xAPI transport failed");
      })
      .finally(() => {
        inflightById.delete(normalized.id);
        inflightStatements.delete(normalized.id);
      });
    inflightById.set(normalized.id, flight);
    void flight.catch(() => {});
  };

  const emit = (event: Parameters<typeof telemetryEventToXAPIStatement>[0]) => {
    try {
      const statement = telemetryEventToXAPIStatement(event);
      /* v8 ignore start -- public emit paths always map to a statement */
      if (!statement) return;
      /* v8 ignore stop */
      sendOrQueue(statement);
    } catch (err) {
      if (isDevEnvironment()) {
        console.warn(
          "[lessonkit] xAPI mapping skipped:",
          err instanceof Error ? err.message : err,
        );
      }
    }
  };

  return {
    send: (statement) => {
      sendOrQueue(statement);
    },
    queueSize: () => queue.size(),
    flush: async () => {
      if (!transport) return;
      await queue.flush(transport);
      const flights = [...inflightById.values()];
      if (flights.length > 0) {
        await Promise.allSettled(flights);
      }
    },
    flushOnExit: exitTransport
      ? () => {
          const exitSentIds = new Set<string>();
          for (const statement of inflightStatements.values()) {
            if (exitSentIds.has(statement.id)) continue;
            try {
              exitTransport(statement);
              exitSentIds.add(statement.id);
            } catch {
              // page is unloading
            }
          }
          queue.flushOnExit((statement) => {
            if (exitSentIds.has(statement.id)) return;
            exitTransport(statement);
            exitSentIds.add(statement.id);
          });
        }
      : undefined,
    startedLesson: ({ lessonId }: { lessonId: LessonId }) => {
      if (!courseId) return;
      emit({
        name: "lesson_started",
        timestamp: nowIso(),
        courseId,
        lessonId,
        data: { lessonId },
      });
    },
    completeLesson: ({
      lessonId,
      durationMs,
      score,
      maxScore,
      success,
    }: {
      lessonId: LessonId;
      durationMs?: number;
      score?: number;
      maxScore?: number;
      success?: boolean;
    }) => {
      if (!courseId) return;
      emit({
        name: "lesson_completed",
        timestamp: nowIso(),
        courseId,
        lessonId,
        data: { lessonId, durationMs, score, maxScore, success },
      });
    },
    completeCourse: () => {
      if (!courseId) return;
      emit({
        name: "course_completed",
        timestamp: nowIso(),
        courseId,
      });
    },
  };
}
