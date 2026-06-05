import type { TelemetryEvent } from "@lessonkit/core";
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
  /** LMS bridge missing for a completion-related telemetry event (`bridge: auto`). */
  onLxpackBridgeMiss?: (event: TelemetryEvent) => void;
};

export function createXapiQueueFromObservability(
  observability?: LessonkitObservabilityConfig,
): ReturnType<typeof createInMemoryXAPIQueue> {
  const opts: InMemoryXAPIQueueOptions = {};
  if (observability?.onXapiQueueDepth) {
    opts.onDepth = observability.onXapiQueueDepth;
  }
  if (observability?.onXapiQueueCap) {
    opts.onCap = observability.onXapiQueueCap;
  }
  return createInMemoryXAPIQueue(opts);
}

type TrackingSink = NonNullable<LessonkitConfig["tracking"]>["sink"];

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
        });
      }
      return result;
    } catch (err) {
      onError(err, { sinkId: "tracking" });
      return undefined;
    }
  }) as TrackingSink;
}
