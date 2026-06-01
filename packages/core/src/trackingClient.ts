import type { TelemetryBatchSink, TelemetryEvent, TelemetrySink, TrackingClient } from "./telemetryTypes";

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

function invokeTrackingSink(sink: TelemetrySink, event: TelemetryEvent): void {
  let result: void | Promise<void>;
  try {
    result = sink(event);
  } catch (err) {
    if (isDevEnvironment()) {
      console.warn(
        "[lessonkit] tracking sink failed:",
        err instanceof Error ? err.message : err,
      );
    }
    throw err;
  }
  if (result != null && typeof (result as Promise<void>).catch === "function") {
    void (result as Promise<void>).catch((err) => {
      if (isDevEnvironment()) {
        console.warn(
          "[lessonkit] tracking sink failed:",
          err instanceof Error ? err.message : err,
        );
      }
    });
  }
}

export function createTrackingClient(opts?: {
  sink?: TelemetrySink;
  batch?: {
    enabled?: boolean;
    flushIntervalMs?: number;
    maxBatchSize?: number;
  };
  batchSink?: TelemetryBatchSink;
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
  let flushInFlight: Promise<void> | null = null;
  let disposed = false;
  let disposing = false;
  let intervalId: ReturnType<typeof globalThis.setInterval> | undefined;

  const runFlush = (): Promise<void> => {
    /* v8 ignore start -- flush() never invokes runFlush with an empty buffer */
    if (!buffer.length) return Promise.resolve();
    /* v8 ignore stop */

    const events = buffer.splice(0, buffer.length);
    let sent = 0;
    let succeeded = false;

    return Promise.resolve()
      .then(async () => {
        if (batchSink) {
          await batchSink(events);
        } else {
          for (const e of events) {
            await sink?.(e);
            sent += 1;
          }
        }
        succeeded = true;
      })
      .catch(() => {
        buffer.unshift(...events.slice(sent));
      })
      .then(() => {
        if (succeeded && buffer.length > 0 && !disposed) {
          return runFlush();
        }
      });
  };

  const flush = (): Promise<void> => {
    if (disposed) return Promise.resolve();
    if (flushInFlight) return flushInFlight;
    if (!buffer.length) return Promise.resolve();

    flushInFlight = runFlush().finally(() => {
      flushInFlight = null;
    });
    return flushInFlight;
  };

  const drainAll = async (): Promise<void> => {
    await flush();
    /* v8 ignore start -- second flush pass; covered indirectly via dispose integration tests */
    while (buffer.length > 0) {
      await flush();
    }
    /* v8 ignore end */
  };

  intervalId = flushIntervalMs > 0 ? globalThis.setInterval(() => void flush(), flushIntervalMs) : undefined;
  (intervalId as unknown as { unref?: () => void } | undefined)?.unref?.();

  return {
    track: (event) => {
      if (disposed || disposing) return;
      if (buffer.length >= maxBufferSize) {
        buffer.shift();
        if (!warnedBufferCap && isDevEnvironment()) {
          warnedBufferCap = true;
          console.warn(
            `[lessonkit] telemetry batch buffer capped at ${maxBufferSize} events; oldest events are dropped while the sink is unavailable.`,
          );
        }
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
