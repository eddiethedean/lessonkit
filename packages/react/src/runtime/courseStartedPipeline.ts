import type { CourseId, TelemetryEvent, TelemetryPipelineSink } from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import { telemetryEventToXAPIStatement } from "@lessonkit/xapi";
import { forwardTelemetryToLxpack, type LxpackBridgeMode } from "./lxpackBridge";

export type CourseStartedPipelineEmitOpts = {
  event: TelemetryEvent;
  xapi: XAPIClient | null;
  lxpackBridge: LxpackBridgeMode;
  extraSinks?: TelemetryPipelineSink[];
  /** When xAPI already sent course_started for this client (layout bootstrap or prior pipeline). */
  skipXapi?: boolean;
};

export type CourseStartedPipelineEmitResult = {
  xapiStatementSent: boolean;
};

/**
 * Emit course_started to non-tracking sinks (xAPI, lxpack bridge, extraSinks).
 * Propagates sync failures so callers can retry; does not use the swallowing telemetry pipeline.
 */
export function emitCourseStartedNonTrackingPipeline(
  opts: CourseStartedPipelineEmitOpts,
): CourseStartedPipelineEmitResult {
  let xapiStatementSent = false;

  if (!opts.skipXapi && opts.xapi) {
    const statement = telemetryEventToXAPIStatement(opts.event);
    if (statement) {
      opts.xapi.send(statement);
      xapiStatementSent = true;
    }
  }

  forwardTelemetryToLxpack(opts.event, opts.lxpackBridge);

  const emitCtx = {
    courseId: opts.event.courseId as CourseId,
    sessionId: opts.event.sessionId,
    attemptId: opts.event.attemptId,
  };

  for (const sink of opts.extraSinks ?? []) {
    sink.emit(opts.event, emitCtx);
  }

  return { xapiStatementSent };
}
