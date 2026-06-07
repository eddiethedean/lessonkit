import type { CourseId, TelemetryEvent, TelemetryEventName } from "./telemetryTypes";
import { warnDev } from "./internal/env";

export type EmitContext = {
  courseId: CourseId;
  sessionId?: string;
  attemptId?: string;
};

/** Pluggable telemetry output (OCP). Distinct from the legacy `TelemetrySink` function type. */
export type TelemetryPipelineSink = {
  readonly id: string;
  emit(event: TelemetryEvent, ctx: EmitContext): void | Promise<void>;
};

export type TelemetryPipeline = {
  readonly sinks: readonly TelemetryPipelineSink[];
  emit(event: TelemetryEvent, ctx?: EmitContext): void | Promise<void>;
};

const LIFECYCLE_TELEMETRY_EVENTS = new Set<TelemetryEventName>([
  "course_started",
  "course_completed",
  "lesson_started",
  "lesson_completed",
  "lesson_time_on_task",
]);

export function isLifecycleTelemetryEvent(name: TelemetryEventName): boolean {
  return LIFECYCLE_TELEMETRY_EVENTS.has(name);
}

async function invokeSink(
  sink: TelemetryPipelineSink,
  event: TelemetryEvent,
  emitCtx: EmitContext,
): Promise<void> {
  let result: void | Promise<void>;
  try {
    result = sink.emit(event, emitCtx);
  } catch (err) {
    warnDev(`[lessonkit] telemetry sink "${sink.id}" failed:`, err);
    return;
  }
  if (result != null && typeof (result as Promise<void>).then === "function") {
    try {
      await result;
    } catch (err) {
      warnDev(`[lessonkit] telemetry sink "${sink.id}" failed:`, err);
    }
  }
}

export function createTelemetryPipeline(sinks: TelemetryPipelineSink[]): TelemetryPipeline {
  const list = [...sinks];

  return {
    sinks: list,
    async emit(event, ctx) {
      const emitCtx: EmitContext = ctx ?? {
        courseId: event.courseId,
        sessionId: event.sessionId,
        attemptId: event.attemptId,
      };
      for (const sink of list) {
        await invokeSink(sink, event, emitCtx);
      }
    },
  };
}

export function createTrackingPipelineSink(
  id: string,
  track: (event: TelemetryEvent) => void,
): TelemetryPipelineSink {
  return {
    id,
    emit(event) {
      track(event);
    },
  };
}
