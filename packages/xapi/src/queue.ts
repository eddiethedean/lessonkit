import type { XAPIQueue, XAPIStatement, XAPITransport } from "./types";

export function createInMemoryXAPIQueue(): XAPIQueue {
  const buffer: XAPIStatement[] = [];
  return {
    enqueue: (statement) => {
      buffer.push(statement);
    },
    size: () => buffer.length,
    flush: async (transport: XAPITransport) => {
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

