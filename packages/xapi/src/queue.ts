import type { XAPIQueue, XAPIStatement, XAPITransport } from "./types";

export type InMemoryXAPIQueueOptions = {
  /** Maximum queued statements (default 1000). Oldest entries are dropped when full. */
  maxSize?: number;
  /** Called after enqueue with the current queue size. */
  onDepth?: (size: number) => void;
  /** Called when an oldest statement is dropped because the queue is at maxSize. */
  onCap?: () => void;
};

const DEFAULT_MAX_QUEUE_SIZE = 1000;

export function createInMemoryXAPIQueue(opts?: InMemoryXAPIQueueOptions): XAPIQueue {
  const maxSize = opts?.maxSize ?? DEFAULT_MAX_QUEUE_SIZE;
  const buffer: XAPIStatement[] = [];
  let flushInFlight: Promise<void> | null = null;
  let headInFlight = false;

  const notifyDepth = () => {
    opts?.onDepth?.(buffer.length);
  };

  const runFlush = async (transport: XAPITransport): Promise<void> => {
    while (buffer.length) {
      const statement = buffer[0]!;
      headInFlight = true;
      try {
        await transport(statement);
        buffer.shift();
        notifyDepth();
      } catch {
        // Stop flushing on first error; keep remainder queued.
        return;
      } finally {
        headInFlight = false;
      }
    }
  };

  return {
    enqueue: (statement) => {
      if (statement.id && buffer.some((s) => s.id === statement.id)) return;
      if (buffer.length >= maxSize) {
        if (headInFlight) {
          opts?.onCap?.();
          return;
        }
        buffer.shift();
        opts?.onCap?.();
      }
      buffer.push(statement);
      notifyDepth();
    },
    size: () => buffer.length,
    flush: async (transport: XAPITransport) => {
      if (flushInFlight) return flushInFlight;
      if (!buffer.length) return;

      flushInFlight = runFlush(transport).finally(() => {
        flushInFlight = null;
      });
      return flushInFlight;
    },
  };
}

