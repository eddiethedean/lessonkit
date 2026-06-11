import type { EmitContext, TelemetryEvent, TelemetryPipelineSink, TrackingClient } from "@lessonkit/core";
import {
  isLifecycleTelemetryEvent,
  type TelemetryPipeline,
} from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import { telemetryEventToXAPIStatement } from "@lessonkit/xapi";
import { forwardTelemetryToLxpack, type LxpackBridgeMode } from "./lxpackBridge";
import type { LessonkitObservabilityConfig } from "./observability";

export type LegacyEmitOptions = {
  tracking: TrackingClient;
  xapi: XAPIClient | null;
  lxpackBridge: LxpackBridgeMode;
  allowedParentOrigins?: string[];
  onLxpackBridgeMiss?: (event: TelemetryEvent) => void;
  onLxpackBridgeError?: LessonkitObservabilityConfig["onLxpackBridgeError"];
  onXapiMappingError?: LessonkitObservabilityConfig["onXapiMappingError"];
  onXapiTransportError?: LessonkitObservabilityConfig["onXapiTransportError"];
};

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

async function deliverToTrackingSink(
  tracking: TrackingClient,
  event: TelemetryEvent,
): Promise<boolean> {
  if (isLifecycleTelemetryEvent(event.name) && tracking.deliver) {
    return tracking.deliver(event);
  }
  return tracking.track(event) !== false;
}

async function invokeExtraSink(
  sink: TelemetryPipelineSink,
  event: TelemetryEvent,
  emitCtx: EmitContext,
): Promise<void> {
  let result: void | Promise<void>;
  try {
    result = sink.emit(event, emitCtx);
  } catch {
    return;
  }
  if (result != null && typeof (result as Promise<void>).then === "function") {
    try {
      await result;
    } catch {
      /* sink errors are non-fatal */
    }
  }
}

function createLegacyPipeline(
  opts: LegacyEmitOptions,
  extraSinks: TelemetryPipelineSink[] = [],
): TelemetryPipeline {
  async function emitToXapi(event: TelemetryEvent): Promise<void> {
    let statement;
    try {
      statement = telemetryEventToXAPIStatement(event);
    } catch (err) {
      opts.onXapiMappingError?.(err);
      if (isDevEnvironment()) {
        console.warn(
          "[lessonkit] xAPI mapping skipped:",
          err instanceof Error ? err.message : err,
        );
      }
      return;
    }
    if (!statement || !opts.xapi) return;
    try {
      opts.xapi.send(statement);
      if (isLifecycleTelemetryEvent(event.name)) {
        await opts.xapi.flush();
      }
    } catch (err) {
      opts.onXapiTransportError?.(err);
      if (isDevEnvironment()) {
        console.warn(
          "[lessonkit] xAPI delivery failed:",
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  function emitToLxpack(event: TelemetryEvent): void {
    forwardTelemetryToLxpack(event, opts.lxpackBridge, {
      onBridgeMiss: opts.onLxpackBridgeMiss,
      onBridgeError: opts.onLxpackBridgeError,
      allowedParentOrigins: opts.allowedParentOrigins,
    });
  }

  const sinks: TelemetryPipelineSink[] = [
    { id: "tracking", emit: () => undefined },
    { id: "xapi", emit: () => undefined },
    { id: "lxpack-bridge", emit: () => undefined },
    ...extraSinks,
  ];

  return {
    sinks,
    async emit(event, ctx) {
      const accepted = await deliverToTrackingSink(opts.tracking, event);
      if (!accepted) return;

      const emitCtx: EmitContext = ctx ?? {
        courseId: event.courseId,
        sessionId: event.sessionId,
        attemptId: event.attemptId,
      };

      await emitToXapi(event);
      emitToLxpack(event);
      for (const sink of extraSinks) {
        await invokeExtraSink(sink, event, emitCtx);
      }
    },
  };
}

export function emitThroughPipeline(
  event: TelemetryEvent,
  opts: LegacyEmitOptions,
  extraSinks?: TelemetryPipelineSink[],
): void | Promise<void> {
  return createLegacyPipeline(opts, extraSinks).emit(event);
}

export function createPipelineFromLegacyConfig(opts: LegacyEmitOptions): TelemetryPipeline {
  return createLegacyPipeline(opts);
}
