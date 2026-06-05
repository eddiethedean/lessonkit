import type { TelemetryBatchSink, TelemetryEvent, TelemetrySink, TrackingClient } from "./telemetryTypes";
import { invokeTrackingSink } from "./internal/sinkInvoke";
import { isDevEnvironment } from "./internal/env";

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
        if (disposed) return;
        if (sink) invokeTrackingSink(sink, event);
      },
      dispose: () => {
        disposed = true;
      },
    };
  }

  if (!sink && !batchSink) {
    return { track: () => {} };
  }

  const buffer: TelemetryEvent[] = [];
  let flushInFlight: Promise<boolean> | null = null;
  let disposed = false;
  let disposing = false;
  let intervalId: ReturnType<typeof globalThis.setInterval> | undefined;

  const runFlush = (): Promise<boolean> => {
    /* v8 ignore start -- flush() never invokes runFlush with an empty buffer */
    if (!buffer.length) return Promise.resolve(true);
    /* v8 ignore stop */

    const events = buffer.splice(0, buffer.length);
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
              buffer.unshift(...events.slice(i));
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
      if (isDevEnvironment()) {
        console.warn(
          `[lessonkit] dropped ${buffer.length} buffered telemetry event(s) after dispose flush cap`,
        );
      }
      buffer.length = 0;
    }
  };

  intervalId = flushIntervalMs > 0 ? globalThis.setInterval(() => void flush(), flushIntervalMs) : undefined;
  (intervalId as unknown as { unref?: () => void } | undefined)?.unref?.();

  return {
    track: (event) => {
      if (disposed || disposing) return;
      if (buffer.length >= maxBufferSize) {
        opts?.onBufferDrop?.();
        if (!warnedBufferCap && isDevEnvironment()) {
          warnedBufferCap = true;
          console.warn(
            `[lessonkit] telemetry batch buffer capped at ${maxBufferSize} events; new events are dropped until the buffer drains.`,
          );
        }
        return;
      }
      buffer.push(event);
      if (buffer.length >= maxBatchSize) void flush();
    },
    flush,
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
