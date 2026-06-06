import type { TelemetryEvent, TelemetryBatchSink } from "@lessonkit/core";
import type { InMemoryXAPIQueueOptions } from "@lessonkit/xapi";
import { createInMemoryXAPIQueue } from "@lessonkit/xapi";
import type { LessonkitConfig } from "../context";

export type LessonkitObservabilityConfig = {
  /** Tracking or pipeline sink failure (sync or async). */
  onTelemetrySinkError?: (err: unknown, ctx: { sinkId?: string }) => void;
  /** Current xAPI queue depth after enqueue or flush. */
  onXapiQueueDepth?: (depth: number) => void;
  /** Oldest xAPI statement dropped because the queue reached max size. */
  onXapiQueueCap?: () => void;
  /** Telemetry batch buffer dropped an event because the cap (1000) was reached. */
  onTelemetryBufferDrop?: () => void;
  /** LMS bridge missing for a completion-related telemetry event (`bridge: auto`). */
  onLxpackBridgeMiss?: (event: TelemetryEvent) => void;
  /** xAPI transport failure after retries (statement re-queued). */
  onXapiTransportError?: (err: unknown) => void;
};

export function createXapiQueueFromObservability(
  getObservability?: () => LessonkitObservabilityConfig | undefined,
): ReturnType<typeof createInMemoryXAPIQueue> {
  const opts: InMemoryXAPIQueueOptions = {
    onDepth: (size) => getObservability?.()?.onXapiQueueDepth?.(size),
    onCap: () => getObservability?.()?.onXapiQueueCap?.(),
  };
  return createInMemoryXAPIQueue(opts);
}

type TrackingSink = NonNullable<LessonkitConfig["tracking"]>["sink"];

export function wrapBatchSink(
  batchSink: TelemetryBatchSink | undefined,
  observability?: LessonkitObservabilityConfig,
): TelemetryBatchSink | undefined {
  if (!batchSink || !observability?.onTelemetrySinkError) return batchSink;
  const onError = observability.onTelemetrySinkError;
  return async (events) => {
    try {
      await batchSink(events);
    } catch (err) {
      onError(err, { sinkId: "tracking-batch" });
      throw err;
    }
  };
}

export function warnMissingProductionObservability(
  observability: LessonkitObservabilityConfig | undefined,
  opts: { trackingEnabled: boolean; xapiEnabled: boolean },
): void {
  let isProduction = false;
  try {
    const env = (import.meta as { env?: { PROD?: boolean; MODE?: string } }).env;
    if (env?.MODE === "test") return;
    isProduction = env?.PROD === true;
  } catch {
    // no import.meta
  }
  if (!isProduction) {
    const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
    isProduction =
      typeof g.process !== "undefined" && g.process.env?.NODE_ENV === "production";
  }
  if (!isProduction) return;
  if (!opts.trackingEnabled && !opts.xapiEnabled) return;
  const required: Array<unknown> = [observability?.onLxpackBridgeMiss];
  if (opts.trackingEnabled) {
    required.push(observability?.onTelemetrySinkError, observability?.onTelemetryBufferDrop);
  }
  if (opts.xapiEnabled) {
    required.push(
      observability?.onXapiQueueDepth,
      observability?.onXapiQueueCap,
      observability?.onXapiTransportError,
    );
  }
  if (!required.some((hook) => !hook)) return;
  if (typeof console !== "undefined") {
    console.warn(
      "[lessonkit] Production deployment without observability hooks — telemetry/xAPI failures and buffer drops will be silent. See https://lessonkit.readthedocs.io/en/latest/guides/react-developers/production-checklist.html",
    );
  }
}

export function wrapTrackingSink(
  sink: TrackingSink,
  observability?: LessonkitObservabilityConfig,
): TrackingSink {
  if (!sink || !observability?.onTelemetrySinkError) return sink;
  const onError = observability.onTelemetrySinkError;
  return ((event: TelemetryEvent) => {
    try {
      const result = sink(event);
      if (result != null && typeof (result as Promise<void>).catch === "function") {
        return (result as Promise<void>).catch((err) => {
          onError(err, { sinkId: "tracking" });
          throw err;
        });
      }
      return result;
    } catch (err) {
      onError(err, { sinkId: "tracking" });
      throw err;
    }
  }) as TrackingSink;
}
