import type { TelemetryEvent } from "./telemetryTypes";

export type EmitContext = {
  courseId: string;
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

export function createTelemetryPipeline(sinks: TelemetryPipelineSink[]): TelemetryPipeline {
  const list = [...sinks];

  return {
    sinks: list,
    emit(event, ctx) {
      const emitCtx: EmitContext = ctx ?? {
        courseId: event.courseId,
        sessionId: event.sessionId,
        attemptId: event.attemptId,
      };
      for (const sink of list) {
        void sink.emit(event, emitCtx);
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
