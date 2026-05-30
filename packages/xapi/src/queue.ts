import type { XAPIQueue, XAPIStatement, XAPITransport } from "./types";

export function createInMemoryXAPIQueue(): XAPIQueue {
  const buffer: XAPIStatement[] = [];
  let flushInFlight: Promise<void> | null = null;

  const runFlush = async (transport: XAPITransport): Promise<void> => {
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
  };

  return {
    enqueue: (statement) => {
      buffer.push(statement);
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

