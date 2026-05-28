import type { TelemetryBatchSink, TelemetryEvent, TelemetrySink, TrackingClient } from "./telemetryTypes";

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
  const batchEnabled = opts?.batch?.enabled ?? Boolean(batchSink);
  const flushIntervalMs = opts?.batch?.flushIntervalMs ?? 5000;
  const maxBatchSize = opts?.batch?.maxBatchSize ?? 25;

  if (!batchEnabled) {
    let disposed = false;
    return {
      track: (event) => {
        if (disposed) return;
        void sink?.(event);
      },
      dispose: () => {
        disposed = true;
      },
    };
  }

  if (!sink && !batchSink) {
    // Batching with no sink is a black hole; default to a safe no-op.
    return { track: () => {} };
  }

  const buffer: TelemetryEvent[] = [];
  let flushInFlight: Promise<void> | null = null;
  let disposed = false;
  let intervalId: ReturnType<typeof globalThis.setInterval> | undefined;

  const flush = (): void => {
    if (disposed || flushInFlight) return;
    if (!buffer.length) return;

    const events = buffer.splice(0, buffer.length);
    let sent = 0;
    let succeeded = false;
    flushInFlight = Promise.resolve()
      .then(async () => {
        if (batchSink) {
          await batchSink(events);
        } else {
          // If per-event sink throws partway through, only re-queue the unsent tail.
          for (const e of events) {
            await sink?.(e);
            sent += 1;
          }
        }
        succeeded = true;
      })
      .catch(() => {
        // Re-queue on any error so events aren't silently dropped.
        // If failure occurred after some per-event sends, only re-queue what wasn't sent yet.
        buffer.unshift(...events.slice(sent));
      })
      .finally(() => {
        flushInFlight = null;
        if (succeeded && !disposed && buffer.length > 0) flush();
      });
  };

  intervalId = flushIntervalMs > 0 ? globalThis.setInterval(flush, flushIntervalMs) : undefined;
  // Avoid keeping Node processes alive solely for telemetry flushing (test/CLI friendliness).
  // In browsers this is a no-op; in Node, `unref()` allows process exit.
  (intervalId as unknown as { unref?: () => void } | undefined)?.unref?.();

  return {
    track: (event) => {
      if (disposed) return;
      buffer.push(event);
      if (buffer.length >= maxBatchSize) flush();
    },
    flush,
    dispose: () => {
      if (disposed) return;
      if (intervalId !== undefined) {
        globalThis.clearInterval(intervalId);
        intervalId = undefined;
      }
      flush();
      disposed = true;
    },
  };
}

