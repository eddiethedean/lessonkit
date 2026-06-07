import type { CourseId, TelemetryEvent, TelemetryPipelineSink } from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import { telemetryEventToXAPIStatement } from "@lessonkit/xapi";
import { forwardTelemetryToLxpack, type LxpackBridgeMode } from "./lxpackBridge";

export type CourseStartedPipelineEmitOpts = {
  event: TelemetryEvent;
  xapi: XAPIClient | null;
  lxpackBridge: LxpackBridgeMode;
  allowedParentOrigins?: string[];
  onLxpackBridgeMiss?: (event: TelemetryEvent) => void;
  onLxpackBridgeError?: (err: unknown) => void;
  onXapiMappingError?: (err: unknown) => void;
  extraSinks?: TelemetryPipelineSink[];
  /** When xAPI already sent course_started for this client (layout bootstrap or prior pipeline). */
  skipXapi?: boolean;
  /** Called immediately after xAPI flush succeeds, before extra sinks. */
  onXapiDelivered?: () => void;
  /** Called after xAPI and lxpack bridge, before extra sinks (for independent mark commits). */
  onBeforeExtraSinks?: () => void | Promise<void>;
};

export type CourseStartedPipelineEmitResult = {
  xapiStatementSent: boolean;
};

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

function warnExtraSinkFailure(sinkId: string, err: unknown): void {
  if (isDevEnvironment()) {
    console.warn(
      `[lessonkit] course_started extra sink "${sinkId}" failed:`,
      err instanceof Error ? err.message : err,
    );
  }
}

async function emitExtraSinks(
  sinks: TelemetryPipelineSink[],
  event: TelemetryEvent,
  emitCtx: { courseId: CourseId; sessionId?: string; attemptId?: string },
): Promise<void> {
  await Promise.all(
    sinks.map(async (sink) => {
      let result: void | Promise<void>;
      try {
        result = sink.emit(event, emitCtx);
      } catch (err) {
        warnExtraSinkFailure(sink.id, err);
        throw err;
      }
      if (result != null && typeof (result as Promise<void>).then === "function") {
        try {
          await result;
        } catch (err) {
          warnExtraSinkFailure(sink.id, err);
          throw err;
        }
      }
    }),
  );
}

/**
 * Emit course_started to non-tracking sinks (xAPI, lxpack bridge, extraSinks).
 * Propagates sync/async failures so callers can retry; does not use the swallowing telemetry pipeline.
 */
export async function emitCourseStartedNonTrackingPipeline(
  opts: CourseStartedPipelineEmitOpts,
): Promise<CourseStartedPipelineEmitResult> {
  let xapiStatementSent = false;

  if (!opts.skipXapi && opts.xapi) {
    let statement;
    try {
      statement = telemetryEventToXAPIStatement(opts.event);
    } catch (err) {
      opts.onXapiMappingError?.(err);
      if (isDevEnvironment()) {
        console.warn(
          "[lessonkit] course_started xAPI mapping skipped:",
          err instanceof Error ? err.message : err,
        );
      }
      statement = null;
    }
    if (statement) {
      opts.xapi.send(statement);
      await opts.xapi.flush();
      xapiStatementSent = true;
      opts.onXapiDelivered?.();
    }
  }

  forwardTelemetryToLxpack(opts.event, opts.lxpackBridge, {
    onBridgeMiss: opts.onLxpackBridgeMiss,
    onBridgeError: opts.onLxpackBridgeError,
    allowedParentOrigins: opts.allowedParentOrigins,
  });

  if (opts.onBeforeExtraSinks) {
    await opts.onBeforeExtraSinks();
  }

  const emitCtx = {
    courseId: opts.event.courseId as CourseId,
    sessionId: opts.event.sessionId,
    attemptId: opts.event.attemptId,
  };

  await emitExtraSinks(opts.extraSinks ?? [], opts.event, emitCtx);

  return { xapiStatementSent };
}
