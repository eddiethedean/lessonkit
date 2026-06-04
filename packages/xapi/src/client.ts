import type { CourseId, LessonId } from "@lessonkit/core";
import { nowIso } from "@lessonkit/core";
import type { XAPIClient, XAPIQueue, XAPIStatement, XAPITransport } from "./types";
import { createInMemoryXAPIQueue } from "./queue";
import { telemetryEventToXAPIStatement } from "./telemetryMap";

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

export function createXAPIClient(opts?: {
  transport?: XAPITransport;
  courseId?: CourseId;
  queue?: XAPIQueue;
  /** When creating the default in-memory queue (max size 1000 unless overridden). */
  maxQueueSize?: number;
  onQueueDepth?: (size: number) => void;
  onQueueCap?: () => void;
}): XAPIClient {
  const transport = opts?.transport;
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

  const sendOrQueue = (statement: XAPIStatement) => {
    if (!transport) {
      queue.enqueue(statement);
      if (isDevEnvironment() && !warnedNoTransport) {
        warnedNoTransport = true;
        console.warn(
          "[lessonkit] xAPI statements are queued but no transport is configured; pass config.xapi.transport or config.xapi.client",
        );
      }
      return;
    }
    const existing = inflightById.get(statement.id);
    if (existing) {
      void existing.then(
        () => undefined,
        () => {
          sendOrQueue(statement);
        },
      );
      return;
    }

    const transportFlight = Promise.resolve().then(() => transport(statement));
    const flight = transportFlight
      .catch(() => {
        queue.enqueue(statement);
        if (isDevEnvironment() && !warnedTransportFailure) {
          warnedTransportFailure = true;
          console.warn(
            "[lessonkit] xAPI transport failed; statement re-queued. Check your LRS endpoint or transport implementation.",
          );
        }
      })
      .finally(() => {
        inflightById.delete(statement.id);
      });
    inflightById.set(statement.id, transportFlight);
    void flight;
  };

  const emit = (event: Parameters<typeof telemetryEventToXAPIStatement>[0]) => {
    const statement = telemetryEventToXAPIStatement(event);
    /* v8 ignore start -- public emit paths always map to a statement */
    if (!statement) return;
    /* v8 ignore stop */
    sendOrQueue(statement);
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
