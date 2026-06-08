import type { TelemetryBatchSink, TelemetryEvent, TelemetrySink, TrackingClient } from "./telemetryTypes";
import { invokeTrackingSink, invokeTrackingSinkWithResult } from "./internal/sinkInvoke";
import { isDevEnvironment } from "./internal/env";

function eventDedupKey(event: TelemetryEvent): string | undefined {
  const id = event.id?.trim();
  return id || undefined;
}

/**
 * Creates a client that buffers telemetry and flushes in batches.
 *
 * **Delivery semantics:** batch mode is at-least-once. A failed flush re-queues the batch for
 * retry; `flushOnExit` and periodic flushes may deliver the same events more than once unless
 * the sink deduplicates. Events currently owned by an in-flight `batchSink` call are not included
 * in `flushOnExit` to avoid duplicate delivery on page unload.
 */
export function createTrackingClient(opts?: {
  sink?: TelemetrySink;
  batch?: {
    enabled?: boolean;
    flushIntervalMs?: number;
    maxBatchSize?: number;
  };
  batchSink?: TelemetryBatchSink;
  /** Called when an event is dropped because the batch buffer is at cap (including in production). */
  onBufferDrop?: () => void;
  /** Keepalive batch delivery for pagehide (e.g. from createFetchBatchSink). */
  exitBatchSink?: TelemetryBatchSink;
}): TrackingClient {
  const sink = opts?.sink;
  const batchSink = opts?.batchSink;
  if (batchSink != null && opts?.batch?.enabled === false) {
    throw new Error(
      "[lessonkit] tracking.batchSink cannot be used with batch.enabled: false; omit batch.enabled or set it to true",
    );
  }
  const batchEnabled = opts?.batch?.enabled ?? Boolean(batchSink);
  const flushIntervalMs = opts?.batch?.flushIntervalMs ?? 5000;
  const maxBatchSize = opts?.batch?.maxBatchSize ?? 25;
  const maxBufferSize = 1000;
  let warnedBufferCap = false;

  if (!batchEnabled) {
    let disposed = false;
    return {
      track: (event) => {
        if (disposed) return false;
        if (sink) {
          try {
            invokeTrackingSink(sink, event);
          } catch {
            // invokeTrackingSink logs in dev; track must not throw
          }
        }
        return true;
      },
      deliver: async (event) => {
        if (disposed) return false;
        if (!sink) return true;
        return invokeTrackingSinkWithResult(sink, event);
      },
      dispose: () => {
        disposed = true;
      },
    };
  }

  if (!sink && !batchSink) {
    return { track: () => true };
  }

  const buffer: TelemetryEvent[] = [];
  const pendingDeliverIds = new Set<string>();
  let flushInFlight: Promise<boolean> | null = null;
  let disposed = false;
  let disposing = false;
  let intervalId: ReturnType<typeof globalThis.setInterval> | undefined;

  const clearPendingDeliverIds = (events: TelemetryEvent[]): void => {
    for (const event of events) {
      const key = eventDedupKey(event);
      if (key) pendingDeliverIds.delete(key);
    }
  };

  const isEventBuffered = (event: TelemetryEvent): boolean => {
    const key = eventDedupKey(event);
    if (!key) return false;
    return buffer.some((buffered) => eventDedupKey(buffered) === key);
  };

  const runFlush = (): Promise<boolean> => {
    /* v8 ignore start -- flush() never invokes runFlush with an empty buffer */
    if (!buffer.length) return Promise.resolve(true);
    /* v8 ignore stop */

    const events = buffer.splice(0, buffer.length);
    for (const event of events) {
      const key = eventDedupKey(event);
      if (key) pendingDeliverIds.add(key);
    }
    let succeeded = false;

    return Promise.resolve()
      .then(async () => {
        if (batchSink) {
          await batchSink(events);
        } else {
          for (let i = 0; i < events.length; i++) {
            try {
              await sink?.(events[i]!);
            } catch {
              buffer.unshift(...events);
              return;
            }
          }
        }
        succeeded = true;
      })
      .catch(() => {
        if (batchSink) {
          buffer.unshift(...events);
        }
      })
      .then(async () => {
        if (succeeded) {
          clearPendingDeliverIds(events);
        }
        if (succeeded && buffer.length > 0 && !disposed) {
          return runFlush();
        }
        return succeeded;
      });
  };

  const flush = (): Promise<boolean> => {
    if (disposed) return Promise.resolve(true);
    if (flushInFlight) return flushInFlight;
    if (!buffer.length) return Promise.resolve(true);

    flushInFlight = runFlush().finally(() => {
      flushInFlight = null;
    });
    return flushInFlight;
  };

  const MAX_DISPOSE_FLUSH_ATTEMPTS = 10;

  const drainAll = async (): Promise<void> => {
    let attempts = 0;
    while (buffer.length > 0 && attempts < MAX_DISPOSE_FLUSH_ATTEMPTS) {
      const delivered = await flush();
      attempts += 1;
      if (!delivered) break;
    }
    if (buffer.length > 0) {
      const droppedCount = buffer.length;
      if (isDevEnvironment()) {
        console.warn(
          `[lessonkit] dropped ${droppedCount} buffered telemetry event(s) after dispose flush cap`,
        );
      }
      for (let i = 0; i < droppedCount; i++) {
        opts?.onBufferDrop?.();
      }
      buffer.length = 0;
      pendingDeliverIds.clear();
    }
  };

  intervalId = flushIntervalMs > 0 ? globalThis.setInterval(() => void flush(), flushIntervalMs) : undefined;
  (intervalId as unknown as { unref?: () => void } | undefined)?.unref?.();

  const track = (event: TelemetryEvent): boolean => {
    if (disposed || disposing) return false;
    const key = eventDedupKey(event);
    if (key && (pendingDeliverIds.has(key) || isEventBuffered(event))) {
      return true;
    }
    if (buffer.length >= maxBufferSize) {
      opts?.onBufferDrop?.();
      if (!warnedBufferCap && isDevEnvironment()) {
        warnedBufferCap = true;
        console.warn(
          `[lessonkit] telemetry batch buffer capped at ${maxBufferSize} events; new events are dropped until the buffer drains.`,
        );
      }
      return false;
    }
    buffer.push(event);
    if (buffer.length >= maxBatchSize) void flush();
    return true;
  };

  return {
    track,
    deliver: async (event) => {
      const key = eventDedupKey(event);
      if (key && (pendingDeliverIds.has(key) || isEventBuffered(event))) {
        return flush();
      }
      if (!track(event)) return false;
      if (key) pendingDeliverIds.add(key);
      return flush();
    },
    flush,
    flushOnExit: opts?.exitBatchSink
      ? () => {
          // In-flight batch is owned by runFlush; only drain the pending buffer here.
          const events = buffer.splice(0, buffer.length);
          if (!events.length) return;
          try {
            const result = opts.exitBatchSink!(events);
            if (result != null && typeof (result as Promise<void>).catch === "function") {
              void (result as Promise<void>)
                .then(() => {
                  clearPendingDeliverIds(events);
                })
                .catch(() => {
                  buffer.unshift(...events);
                });
            } else {
              clearPendingDeliverIds(events);
            }
          } catch {
            buffer.unshift(...events);
          }
        }
      : undefined,
    dispose: () => {
      if (disposed || disposing) return Promise.resolve();
      disposing = true;
      if (intervalId !== undefined) {
        globalThis.clearInterval(intervalId);
        intervalId = undefined;
      }
      return drainAll().finally(() => {
        disposed = true;
        disposing = false;
      });
    },
  };
}
