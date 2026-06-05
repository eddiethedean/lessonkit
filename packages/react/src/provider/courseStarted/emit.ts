import type {
  CourseId,
  PluginHost,
  TelemetryEvent,
  TelemetryUser,
  TrackingClient,
} from "@lessonkit/core";
import { buildTelemetryEvent } from "../../runtime/emitTelemetry";
import type { LxpackBridgeMode } from "../../runtime/lxpackBridge";
import { emitCourseStartedNonTrackingPipeline } from "../../runtime/courseStartedPipeline";
import { buildPluginContext } from "../../runtime/plugins";
import {
  hasCourseStarted,
  hasCourseStartedEmittedToTracking,
  hasCourseStartedPipelineDelivered,
  markCourseStarted,
  markCourseStartedEmittedToTracking,
  markCourseStartedPipelineDelivered,
} from "../../runtime/session";
import type { createSessionStoragePort } from "../../runtime/ports";

export type CourseStartedEmitOpts = {
  pluginHost: PluginHost | null;
  sessionId: string;
  courseId: CourseId;
  attemptId?: string;
  user?: TelemetryUser;
  lxpackBridge: LxpackBridgeMode;
  onLxpackBridgeMiss?: (event: TelemetryEvent) => void;
  extraSinks?: import("@lessonkit/core").TelemetryPipelineSink[];
  skipXapi?: boolean;
  onXapiStatementSent?: () => void;
  shouldCommit?: () => boolean;
};

export type CourseStartedEmitResult = "emitted" | "filtered" | "failed";

type StoragePort = ReturnType<typeof createSessionStoragePort>;

let courseStartedTrackingFlightKey: string | null = null;

/** @internal Reset in-flight course_started tracking guard between tests. */
export function resetCourseStartedTrackingFlightForTests(): void {
  courseStartedTrackingFlightKey = null;
}

export function isTrackingActive(tracking?: { enabled?: boolean }): boolean {
  return tracking?.enabled !== false;
}

export function isCourseStartedSinkSettled(result: CourseStartedEmitResult): boolean {
  return result === "emitted";
}

export function buildCourseStartedEvent(opts: CourseStartedEmitOpts): TelemetryEvent | null {
  const pluginCtx = buildPluginContext({
    courseId: opts.courseId,
    sessionId: opts.sessionId,
    attemptId: opts.attemptId,
    user: opts.user,
  });
  const built = buildTelemetryEvent({
    name: "course_started",
    courseId: opts.courseId,
    sessionId: opts.sessionId,
    attemptId: opts.attemptId,
    user: opts.user,
  });
  return opts.pluginHost ? opts.pluginHost.runTelemetry(built, pluginCtx) : built;
}

export async function emitCourseStartedToTracking(
  tracking: TrackingClient,
  storage: StoragePort,
  sessionId: string,
  courseId: CourseId,
  event: TelemetryEvent,
  shouldCommit?: () => boolean,
): Promise<boolean> {
  const flightKey = `${sessionId}:${courseId}`;
  if (hasCourseStartedEmittedToTracking(storage, sessionId, courseId)) {
    return true;
  }
  if (courseStartedTrackingFlightKey === flightKey) {
    return false;
  }
  courseStartedTrackingFlightKey = flightKey;
  try {
    if (shouldCommit && !shouldCommit()) return false;
    tracking.track(event);
    await tracking.flush?.();
    if (shouldCommit && !shouldCommit()) return false;
    markCourseStartedEmittedToTracking(storage, sessionId, courseId);
    return true;
  } catch {
    return false;
  } finally {
    if (courseStartedTrackingFlightKey === flightKey) {
      courseStartedTrackingFlightKey = null;
    }
  }
}

export async function emitCourseStartedPipelineOnly(
  opts: CourseStartedEmitOpts & {
    xapi: import("@lessonkit/xapi").XAPIClient | null;
    storage: StoragePort;
    event: TelemetryEvent;
    skipXapi?: boolean;
    onXapiStatementSent?: () => void;
  },
): Promise<CourseStartedEmitResult> {
  try {
    if (opts.shouldCommit && !opts.shouldCommit()) return "failed";
    const { xapiStatementSent } = await emitCourseStartedNonTrackingPipeline({
      event: opts.event,
      xapi: opts.xapi,
      lxpackBridge: opts.lxpackBridge,
      onLxpackBridgeMiss: opts.onLxpackBridgeMiss,
      extraSinks: opts.extraSinks,
      skipXapi: opts.skipXapi,
    });
    if (opts.shouldCommit && !opts.shouldCommit()) return "failed";
    markCourseStarted(opts.storage, opts.sessionId, opts.courseId);
    markCourseStartedPipelineDelivered(opts.storage, opts.sessionId, opts.courseId);
    if (xapiStatementSent) {
      opts.onXapiStatementSent?.();
    }
    return "emitted";
  } catch {
    return "failed";
  }
}

export async function emitCourseStarted(
  opts: CourseStartedEmitOpts & {
    tracking: TrackingClient;
    xapi: import("@lessonkit/xapi").XAPIClient | null;
    storage: StoragePort;
  },
): Promise<CourseStartedEmitResult> {
  const event = buildCourseStartedEvent(opts);
  if (event === null) return "filtered";

  const tracked = await emitCourseStartedToTracking(
    opts.tracking,
    opts.storage,
    opts.sessionId,
    opts.courseId,
    event,
    opts.shouldCommit,
  );
  if (!tracked) return "failed";

  return emitCourseStartedPipelineOnly({
    ...opts,
    event,
    skipXapi: opts.skipXapi,
    onXapiStatementSent: opts.onXapiStatementSent,
    shouldCommit: opts.shouldCommit,
  });
}

export async function emitCourseStartedToTrackingOnly(
  opts: CourseStartedEmitOpts & {
    tracking: TrackingClient;
    storage: StoragePort;
  },
): Promise<CourseStartedEmitResult> {
  const event = buildCourseStartedEvent(opts);
  if (event === null) return "filtered";

  const tracked = await emitCourseStartedToTracking(
    opts.tracking,
    opts.storage,
    opts.sessionId,
    opts.courseId,
    event,
    opts.shouldCommit,
  );
  if (!tracked) return "failed";

  try {
    if (opts.shouldCommit && !opts.shouldCommit()) return "failed";
    await emitCourseStartedNonTrackingPipeline({
      event,
      xapi: null,
      lxpackBridge: opts.lxpackBridge,
      onLxpackBridgeMiss: opts.onLxpackBridgeMiss,
      extraSinks: opts.extraSinks,
      skipXapi: true,
    });
    markCourseStartedPipelineDelivered(opts.storage, opts.sessionId, opts.courseId);
    return "emitted";
  } catch {
    return "failed";
  }
}

export async function emitPendingCourseStarted(
  opts: CourseStartedEmitOpts & {
    tracking: TrackingClient;
    xapi: import("@lessonkit/xapi").XAPIClient | null;
    storage: StoragePort;
    skipXapi?: boolean;
    onXapiStatementSent?: () => void;
  },
): Promise<CourseStartedEmitResult> {
  const trackingEmitted = hasCourseStartedEmittedToTracking(
    opts.storage,
    opts.sessionId,
    opts.courseId,
  );
  const sessionStarted = hasCourseStarted(opts.storage, opts.sessionId, opts.courseId);

  if (sessionStarted && !trackingEmitted) {
    return emitCourseStartedToTrackingOnly(opts);
  }
  if (trackingEmitted && !sessionStarted) {
    const event = buildCourseStartedEvent(opts);
    if (event === null) return "filtered";
    return emitCourseStartedPipelineOnly({ ...opts, event });
  }
  if (!trackingEmitted && !sessionStarted) {
    return emitCourseStarted(opts);
  }
  const pipelineDelivered = hasCourseStartedPipelineDelivered(
    opts.storage,
    opts.sessionId,
    opts.courseId,
  );
  if (sessionStarted && trackingEmitted && pipelineDelivered) {
    return "emitted";
  }
  if (sessionStarted && trackingEmitted && !pipelineDelivered) {
    const event = buildCourseStartedEvent(opts);
    if (event === null) return "filtered";
    return emitCourseStartedPipelineOnly({
      ...opts,
      event,
      skipXapi: opts.skipXapi,
      onXapiStatementSent: opts.onXapiStatementSent,
    });
  }
  return "emitted";
}

export function assertTrackingSinkConfig(tracking?: {
  sink?: unknown;
  batchSink?: unknown;
}): void {
  if (!tracking?.sink || !tracking?.batchSink) return;
  throw new Error(
    "[lessonkit] tracking.sink and tracking.batchSink cannot both be set; use batchSink alone for batched delivery",
  );
}
