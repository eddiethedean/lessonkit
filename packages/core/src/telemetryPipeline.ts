import type { CourseId, TelemetryEvent } from "./telemetryTypes";

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

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { NODE_ENV?: string } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

function warnSinkFailure(sinkId: string, err: unknown): void {
  if (isDevEnvironment()) {
    console.warn(
      `[lessonkit] telemetry sink "${sinkId}" failed:`,
      err instanceof Error ? err.message : err,
    );
  }
}

function invokeSink(
  sink: TelemetryPipelineSink,
  event: TelemetryEvent,
  emitCtx: EmitContext,
): void {
  let result: void | Promise<void>;
  try {
    result = sink.emit(event, emitCtx);
  } catch (err) {
    warnSinkFailure(sink.id, err);
    return;
  }
  if (result != null && typeof (result as Promise<void>).catch === "function") {
    void (result as Promise<void>).catch((err) => warnSinkFailure(sink.id, err));
  }
}

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
        invokeSink(sink, event, emitCtx);
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
