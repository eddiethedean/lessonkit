import type { CourseId, LessonId } from "@lessonkit/core";
import { nowIso } from "@lessonkit/core";
import {
  clearDeadLetterStorage,
  loadDeadLetterStatements,
  persistDeadLetterStatement,
  removeDeadLetterStatement,
} from "./deadLetter";
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

function defaultQueueCapHandler(): void {
  if (isDevEnvironment()) {
    console.warn("[lessonkit] xAPI queue reached capacity; oldest statement(s) dropped.");
  }
}

function defaultHeadSkippedHandler(_statement: XAPIStatement, err: unknown): void {
  if (isDevEnvironment()) {
    console.warn(
      "[lessonkit] xAPI queue skipped statement after repeated transport failures:",
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Imperative xAPI client with in-memory queue, retry flush, and optional pagehide delivery.
 * Prefer wiring transport via `LessonkitProvider` config from `@lessonkit/react` in React apps.
 */
export function createXAPIClient(opts?: {
  transport?: XAPITransport;
  /** Keepalive transport for pagehide flush (e.g. from createFetchTransport). */
  exitTransport?: import("./types").XAPIExitTransport;
  /** Abort in-flight transport by statement id (e.g. from createFetchTransport). */
  abortInFlight?: (statementId: string) => void;
  courseId?: CourseId;
  queue?: XAPIQueue;
  /** When creating the default in-memory queue (max size 1000 unless overridden). */
  maxQueueSize?: number;
  /** Consecutive head failures before skip (default queue only). */
  maxHeadFailures?: number;
  onQueueDepth?: (size: number) => void;
  onQueueCap?: () => void;
  onHeadSkipped?: (statement: XAPIStatement, err: unknown) => void;
  /** Called when transport fails after retries (statement is re-queued). */
  onTransportError?: (err: unknown) => void;
  /** Called when telemetry → xAPI mapping fails. */
  onMappingError?: (err: unknown) => void;
}): XAPIClient {
  const transport = opts?.transport;
  const exitTransport = opts?.exitTransport;
  const courseId = opts?.courseId;
  const queue =
    opts?.queue ??
    createInMemoryXAPIQueue({
      maxSize: opts?.maxQueueSize,
      maxHeadFailures: opts?.maxHeadFailures,
      onDepth: opts?.onQueueDepth,
      onCap: opts?.onQueueCap ?? defaultQueueCapHandler,
      onHeadSkipped: (statement, err) => {
        persistDeadLetterStatement(statement);
        (opts?.onHeadSkipped ?? defaultHeadSkippedHandler)(statement, err);
      },
    });
  let warnedNoTransport = false;
  let warnedTransportFailure = false;
  const inflightById = new Map<string, Promise<void>>();
  const inflightStatements = new Map<string, XAPIStatement>();
  const pendingReplacement = new Map<string, XAPIStatement>();
  const inflightPayload = new Map<string, XAPIStatement>();
  const replacementWatcher = new Set<string>();
  const exitDeliveredIds = new Set<string>();
  const exitNetworkSentIds = new Set<string>();
  /** Statement ids handed to exit transport — suppresses abort re-queue race. */
  const exitHandoffIds = new Set<string>();
  let activeFlush: Promise<void> | null = null;

  for (const statement of loadDeadLetterStatements()) {
    queue.enqueue(statement);
  }
  const hadDeadLetters = queue.size() > 0;

  const deliveryTransport: XAPITransport | undefined = transport
    ? async (statement) => {
        if (exitNetworkSentIds.has(statement.id)) return;
        await transport(statement);
        removeDeadLetterStatement(statement.id);
      }
    : undefined;

  const markExitDelivered = (statement: XAPIStatement) => {
    exitHandoffIds.delete(statement.id);
    exitDeliveredIds.add(statement.id);
    exitNetworkSentIds.add(statement.id);
    removeDeadLetterStatement(statement.id);
  };

  const dispatchExitStatement = (statement: XAPIStatement) => {
    if (exitDeliveredIds.has(statement.id)) return;
    exitHandoffIds.add(statement.id);
    try {
      const result = exitTransport!(statement);
      if (result != null && typeof (result as Promise<void>).then === "function") {
        void (result as Promise<void>).then(
          () => markExitDelivered(statement),
          () => {
            exitHandoffIds.delete(statement.id);
            persistDeadLetterStatement(statement);
          },
        );
      } else {
        markExitDelivered(statement);
      }
    } catch {
      exitHandoffIds.delete(statement.id);
      persistDeadLetterStatement(statement);
    }
  };

  const pendingDuringFlush: XAPIStatement[] = [];
  let flushInProgress = false;

  const sendOrQueueInternal = (statement: XAPIStatement) => {
      const normalized = withStatementId(statement);
      if (exitDeliveredIds.has(normalized.id)) return;
      if (!deliveryTransport) {
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
        pendingReplacement.set(normalized.id, normalized);
        inflightStatements.set(normalized.id, normalized);
        if (!replacementWatcher.has(normalized.id)) {
          replacementWatcher.add(normalized.id);
          void existing.then(
            () => {
              replacementWatcher.delete(normalized.id);
              const replacement = pendingReplacement.get(normalized.id);
              const transported = inflightPayload.get(normalized.id);
              pendingReplacement.delete(normalized.id);
              inflightPayload.delete(normalized.id);
              if (replacement && replacement !== transported) {
                sendOrQueueInternal(replacement);
              }
            },
            () => {
              replacementWatcher.delete(normalized.id);
              const replacement = pendingReplacement.get(normalized.id) ?? normalized;
              pendingReplacement.delete(normalized.id);
              sendOrQueueInternal(replacement);
            },
          );
        }
        return;
      }

      inflightStatements.set(normalized.id, normalized);
      inflightPayload.set(normalized.id, normalized);
      const flight = Promise.resolve()
        .then(async () => {
          await deliveryTransport(normalized);
          queue.removeById(normalized.id);
        })
        .catch((err) => {
          if (exitDeliveredIds.has(normalized.id) || exitHandoffIds.has(normalized.id)) return;
          queue.enqueue(normalized);
          opts?.onTransportError?.(err);
          if (isDevEnvironment() && !warnedTransportFailure) {
            warnedTransportFailure = true;
            console.warn(
              "[lessonkit] xAPI transport failed; statement re-queued. Check your LRS endpoint or transport implementation.",
            );
          }
          throw err instanceof Error ? err : new Error("xAPI transport failed", { cause: err });
        })
        .finally(() => {
          inflightById.delete(normalized.id);
          inflightStatements.delete(normalized.id);
          if (!replacementWatcher.has(normalized.id)) {
            inflightPayload.delete(normalized.id);
          }
        });
      inflightById.set(normalized.id, flight);
      void flight.catch(() => {});
  };

  const sendOrQueue = (statement: XAPIStatement) => {
    if (flushInProgress) {
      pendingDuringFlush.push(statement);
      return;
    }
    sendOrQueueInternal(statement);
  };

  const emit = (event: Parameters<typeof telemetryEventToXAPIStatement>[0]) => {
    try {
      const statement = telemetryEventToXAPIStatement(event);
      /* v8 ignore start -- public emit paths always map to a statement */
      if (!statement) return;
      /* v8 ignore stop */
      sendOrQueue(statement);
    } catch (err) {
      opts?.onMappingError?.(err);
      if (isDevEnvironment()) {
        console.warn(
          "[lessonkit] xAPI mapping skipped:",
          err instanceof Error ? err.message : err,
        );
      }
    }
  };

  const runFlushLoop = async (): Promise<void> => {
    if (!deliveryTransport) return;
    for (;;) {
      await queue.flush(deliveryTransport);
      const flights = [...inflightById.values()];
      if (flights.length > 0) {
        await Promise.all(flights);
      }
      if (queue.size() === 0 && inflightById.size === 0) break;
    }
  };

  const client: XAPIClient = {
    send: (statement) => {
      sendOrQueue(statement);
    },
    queueSize: () => queue.size(),
    flush: async () => {
      if (!deliveryTransport) return;
      for (;;) {
        if (activeFlush) {
          await activeFlush;
        } else {
          flushInProgress = true;
          activeFlush = (async () => {
            try {
              await runFlushLoop();
              while (pendingDuringFlush.length > 0) {
                const batch = pendingDuringFlush.splice(0, pendingDuringFlush.length);
                for (const pending of batch) {
                  sendOrQueueInternal(pending);
                }
                await runFlushLoop();
              }
            } finally {
              flushInProgress = false;
            }
          })().finally(() => {
            activeFlush = null;
          });
          await activeFlush;
        }
        if (queue.size() === 0 && inflightById.size === 0) break;
      }
    },
    flushOnExit: exitTransport
      ? () => {
          const headId = queue.getHeadInFlightId?.();
          if (headId) {
            opts.abortInFlight?.(headId);
            const headStatement = inflightStatements.get(headId);
            if (headStatement) {
              dispatchExitStatement(headStatement);
            }
          }
          for (const statement of inflightStatements.values()) {
            if (statement.id === headId) continue;
            opts.abortInFlight?.(statement.id);
            dispatchExitStatement(statement);
          }
          queue.flushOnExit((statement) => {
            dispatchExitStatement(statement);
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

  if (hadDeadLetters && deliveryTransport) {
    queueMicrotask(() => {
      void client.flush().catch(() => undefined);
    });
  }

  return client;
}

/** @internal Reset dead-letter storage between tests. */
export function resetXAPIDeadLetterForTests(): void {
  clearDeadLetterStorage();
}
