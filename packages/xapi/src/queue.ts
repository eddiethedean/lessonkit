import { cryptoRandomId } from "./id";
import type { XAPIExitTransport, XAPIQueue, XAPIStatement, XAPITransport } from "./types";

function withStatementId(statement: XAPIStatement): XAPIStatement {
  const trimmed = statement.id?.trim();
  if (trimmed) {
    if (trimmed !== statement.id) statement.id = trimmed;
    return statement;
  }
  statement.id = cryptoRandomId();
  return statement;
}

export type InMemoryXAPIQueueOptions = {
  /** Maximum queued statements (default 1000). Oldest entries are dropped when full. */
  maxSize?: number;
  /** Called after enqueue with the current queue size. */
  onDepth?: (size: number) => void;
  /** Called when an oldest statement is dropped because the queue is at maxSize. */
  onCap?: () => void;
  /** Failures at queue head before skipping (default 10). */
  maxHeadFailures?: number;
  /** Called when the queue head is skipped after repeated transport failures. */
  onHeadSkipped?: (statement: XAPIStatement, err: unknown) => void;
};

const DEFAULT_MAX_QUEUE_SIZE = 1000;
const DEFAULT_MAX_HEAD_FAILURES = 10;

export function createInMemoryXAPIQueue(opts?: InMemoryXAPIQueueOptions): XAPIQueue {
  const maxSize = opts?.maxSize ?? DEFAULT_MAX_QUEUE_SIZE;
  const maxHeadFailures = opts?.maxHeadFailures ?? DEFAULT_MAX_HEAD_FAILURES;
  const buffer: XAPIStatement[] = [];
  let flushInFlight: Promise<void> | null = null;
  let headInFlight = false;
  let headInFlightId: string | undefined;
  let headFailureCount = 0;

  const notifyDepth = () => {
    opts?.onDepth?.(buffer.length);
  };

  const removeById = (id: string) => {
    const idx = buffer.findIndex((s) => s.id === id);
    if (idx >= 0) {
      buffer.splice(idx, 1);
      notifyDepth();
    }
  };

  const runFlush = async (transport: XAPITransport): Promise<void> => {
    while (buffer.length) {
      const statement = buffer[0]!;
      headInFlight = true;
      headInFlightId = statement.id;
      try {
        await transport(statement);
        buffer.shift();
        headFailureCount = 0;
        notifyDepth();
      } catch (err) {
        headFailureCount += 1;
        if (headFailureCount >= maxHeadFailures) {
          buffer.shift();
          headFailureCount = 0;
          notifyDepth();
          opts?.onHeadSkipped?.(statement, err);
          continue;
        }
        throw err;
      } finally {
        headInFlight = false;
        headInFlightId = undefined;
      }
    }
  };

  return {
    enqueue: (statement) => {
      const normalized = withStatementId(statement);
      const existingIdx = buffer.findIndex((s) => s.id === normalized.id);
      if (existingIdx >= 0) {
        buffer[existingIdx] = normalized;
        notifyDepth();
        return;
      }
      if (buffer.length >= maxSize) {
        if (headInFlight) {
          if (buffer.length >= maxSize) {
            if (buffer.length > 1) {
              buffer.splice(1, 1);
            } else {
              buffer.shift();
            }
          }
        } else {
          buffer.shift();
        }
        opts?.onCap?.();
      }
      buffer.push(normalized);
      notifyDepth();
    },
    removeById,
    size: () => buffer.length,
    flush: async (transport: XAPITransport) => {
      if (flushInFlight) return flushInFlight;
      if (!buffer.length) return;

      flushInFlight = runFlush(transport).finally(() => {
        flushInFlight = null;
      });
      return flushInFlight;
    },
    flushOnExit: (exitTransport: XAPIExitTransport) => {
      for (const statement of buffer) {
        try {
          exitTransport(statement);
        } catch {
          // page is unloading
        }
      }
      buffer.length = 0;
      notifyDepth();
    },
    getHeadInFlightId: () => headInFlightId,
  };
}
