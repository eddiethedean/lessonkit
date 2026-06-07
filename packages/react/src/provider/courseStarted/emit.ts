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
  hasCourseStartedXapiSent,
  markCourseStarted,
  markCourseStartedEmittedToTracking,
  markCourseStartedPipelineDelivered,
  markCourseStartedXapiSent,
} from "../../runtime/session";
import type { createSessionStoragePort } from "../../runtime/ports";

export type CourseStartedEmitOpts = {
  pluginHost: PluginHost | null;
  sessionId: string;
  courseId: CourseId;
  attemptId?: string;
  user?: TelemetryUser;
  lxpackBridge: LxpackBridgeMode;
  allowedParentOrigins?: string[];
  onLxpackBridgeMiss?: (event: TelemetryEvent) => void;
  extraSinks?: import("@lessonkit/core").TelemetryPipelineSink[];
  skipXapi?: boolean;
  onXapiStatementSent?: () => void;
  shouldCommit?: () => boolean;
  flightScope?: CourseStartedFlightScope;
};

export type CourseStartedEmitResult = "emitted" | "filtered" | "failed";

export type CourseStartedFlightScope = {
  trackingFlights: Map<string, Promise<boolean>>;
  emitFlights: Map<string, Promise<CourseStartedEmitResult>>;
};

export function createCourseStartedFlightScope(): CourseStartedFlightScope {
  return {
    trackingFlights: new Map(),
    emitFlights: new Map(),
  };
}

type StoragePort = ReturnType<typeof createSessionStoragePort>;
type TrackingSource = TrackingClient | (() => TrackingClient);

function resolveTrackingClient(source: TrackingSource): TrackingClient {
  return typeof source === "function" ? source() : source;
}

const defaultFlightScope = createCourseStartedFlightScope();

/** @internal Reset in-flight course_started tracking guard between tests. */
export function resetCourseStartedTrackingFlightForTests(): void {
  defaultFlightScope.trackingFlights.clear();
  defaultFlightScope.emitFlights.clear();
}

/** Clear in-flight tracking emits (e.g. when the tracking client is recreated). */
export function resetCourseStartedTrackingFlights(scope?: CourseStartedFlightScope): void {
  const target = scope ?? defaultFlightScope;
  target.trackingFlights.clear();
  target.emitFlights.clear();
}

function resolveFlightScope(scope?: CourseStartedFlightScope): CourseStartedFlightScope {
  return scope ?? defaultFlightScope;
}

export function isTrackingActive(tracking?: { enabled?: boolean }): boolean {
  return tracking?.enabled !== false;
}

export function isCourseStartedSinkSettled(result: CourseStartedEmitResult): boolean {
  // "filtered" means a plugin dropped course_started before tracking delivery — allow retry
  // when the plugin is removed or stops filtering (see emitCourseStartedOnce guard).
  return result === "emitted";
}

async function deliverToTracking(client: TrackingClient, event: TelemetryEvent): Promise<boolean> {
  if (client.deliver) {
    return client.deliver(event);
  }
  client.track(event);
  if (!client.flush) return true;
  const flushed = await client.flush();
  return flushed !== false;
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
  const withId: TelemetryEvent = {
    ...built,
    id: `${opts.sessionId}:${opts.courseId}:course_started`,
  };
  return opts.pluginHost ? opts.pluginHost.runTelemetry(withId, pluginCtx) : withId;
}

export async function emitCourseStartedToTracking(
  tracking: TrackingSource,
  storage: StoragePort,
  sessionId: string,
  courseId: CourseId,
  event: TelemetryEvent,
  shouldCommit?: () => boolean,
  flightScope?: CourseStartedFlightScope,
): Promise<boolean> {
  const scope = resolveFlightScope(flightScope);
  const flightKey = `${sessionId}:${courseId}`;
  if (hasCourseStartedEmittedToTracking(storage, sessionId, courseId)) {
    return true;
  }

  const existing = scope.trackingFlights.get(flightKey);
  if (existing) {
    return existing;
  }

  let resolveFlight!: (value: boolean) => void;
  const flight = new Promise<boolean>((resolve) => {
    resolveFlight = resolve;
  });
  scope.trackingFlights.set(flightKey, flight);

  void (async () => {
    try {
      if (shouldCommit && !shouldCommit()) {
        resolveFlight(false);
        return;
      }
      const client = resolveTrackingClient(tracking);
      const delivered = await deliverToTracking(client, event);
      if (shouldCommit && !shouldCommit()) {
        resolveFlight(false);
        return;
      }
      if (!delivered) {
        resolveFlight(false);
        return;
      }
      if (markCourseStartedEmittedToTracking(storage, sessionId, courseId) === false) {
        if (hasCourseStartedEmittedToTracking(storage, sessionId, courseId)) {
          resolveFlight(true);
          return;
        }
        resolveFlight(false);
        return;
      }
      resolveFlight(true);
    } catch {
      resolveFlight(false);
    } finally {
      if (scope.trackingFlights.get(flightKey) === flight) {
        scope.trackingFlights.delete(flightKey);
      }
    }
  })();

  return flight;
}

function resolveSkipXapi(
  storage: StoragePort,
  sessionId: string,
  courseId: CourseId,
  skipXapi?: boolean,
): boolean {
  return Boolean(skipXapi || hasCourseStartedXapiSent(storage, sessionId, courseId));
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
    const skipXapi = resolveSkipXapi(opts.storage, opts.sessionId, opts.courseId, opts.skipXapi);
    const { xapiStatementSent } = await emitCourseStartedNonTrackingPipeline({
      event: opts.event,
      xapi: opts.xapi,
      lxpackBridge: opts.lxpackBridge,
      allowedParentOrigins: opts.allowedParentOrigins,
      onLxpackBridgeMiss: opts.onLxpackBridgeMiss,
      extraSinks: opts.extraSinks,
      skipXapi,
      onXapiDelivered: () => {
        markCourseStartedXapiSent(opts.storage, opts.sessionId, opts.courseId);
        opts.onXapiStatementSent?.();
      },
      onBeforeExtraSinks: async () => {
        if (opts.shouldCommit && !opts.shouldCommit()) throw new Error("course_started commit aborted");
        if (
          markCourseStarted(opts.storage, opts.sessionId, opts.courseId) === false &&
          !hasCourseStarted(opts.storage, opts.sessionId, opts.courseId)
        ) {
          throw new Error("course_started mark failed");
        }
      },
    });
    if (opts.shouldCommit && !opts.shouldCommit()) return "failed";
    if (
      markCourseStarted(opts.storage, opts.sessionId, opts.courseId) === false &&
      !hasCourseStarted(opts.storage, opts.sessionId, opts.courseId)
    ) {
      return "failed";
    }
    if (
      markCourseStartedPipelineDelivered(opts.storage, opts.sessionId, opts.courseId) === false &&
      !hasCourseStartedPipelineDelivered(opts.storage, opts.sessionId, opts.courseId)
    ) {
      return "failed";
    }
    if (xapiStatementSent && !hasCourseStartedXapiSent(opts.storage, opts.sessionId, opts.courseId)) {
      markCourseStartedXapiSent(opts.storage, opts.sessionId, opts.courseId);
      opts.onXapiStatementSent?.();
    }
    return "emitted";
  } catch {
    return "failed";
  }
}

export async function emitCourseStarted(
  opts: CourseStartedEmitOpts & {
    tracking: TrackingSource;
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
    opts.flightScope,
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
    tracking: TrackingSource;
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
    opts.flightScope,
  );
  if (!tracked) return "failed";

  try {
    if (opts.shouldCommit && !opts.shouldCommit()) return "failed";
    await emitCourseStartedNonTrackingPipeline({
      event,
      xapi: null,
      lxpackBridge: opts.lxpackBridge,
      allowedParentOrigins: opts.allowedParentOrigins,
      onLxpackBridgeMiss: opts.onLxpackBridgeMiss,
      extraSinks: opts.extraSinks,
      skipXapi: true,
    });
    if (markCourseStartedPipelineDelivered(opts.storage, opts.sessionId, opts.courseId) === false) {
      return "failed";
    }
    return "emitted";
  } catch {
    return "failed";
  }
}

export async function emitPendingCourseStarted(
  opts: CourseStartedEmitOpts & {
    tracking: TrackingSource;
    xapi: import("@lessonkit/xapi").XAPIClient | null;
    storage: StoragePort;
    skipXapi?: boolean;
    onXapiStatementSent?: () => void;
  },
): Promise<CourseStartedEmitResult> {
  const scope = resolveFlightScope(opts.flightScope);
  const flightKey = `${opts.sessionId}:${opts.courseId}`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const existing = scope.emitFlights.get(flightKey);
    const flight = existing ?? startPendingCourseStartedFlight(opts, flightKey, scope);
    const result = await flight;
    if (result !== "failed") return result;
    const sessionStarted = hasCourseStarted(opts.storage, opts.sessionId, opts.courseId);
    const trackingEmitted = hasCourseStartedEmittedToTracking(
      opts.storage,
      opts.sessionId,
      opts.courseId,
    );
    const pipelineDelivered = hasCourseStartedPipelineDelivered(
      opts.storage,
      opts.sessionId,
      opts.courseId,
    );
    if (sessionStarted && trackingEmitted && pipelineDelivered) {
      return "emitted";
    }
    if (opts.shouldCommit && !opts.shouldCommit()) return "failed";
  }

  return "failed";
}

function startPendingCourseStartedFlight(
  opts: CourseStartedEmitOpts & {
    tracking: TrackingSource;
    xapi: import("@lessonkit/xapi").XAPIClient | null;
    storage: StoragePort;
    skipXapi?: boolean;
    onXapiStatementSent?: () => void;
  },
  flightKey: string,
  scope: CourseStartedFlightScope,
): Promise<CourseStartedEmitResult> {
  const flight = emitPendingCourseStartedInner(opts);
  scope.emitFlights.set(flightKey, flight);
  void flight.finally(() => {
    if (scope.emitFlights.get(flightKey) === flight) {
      scope.emitFlights.delete(flightKey);
    }
  });
  return flight;
}

async function emitPendingCourseStartedInner(
  opts: CourseStartedEmitOpts & {
    tracking: TrackingSource;
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
  const pipelineDelivered = hasCourseStartedPipelineDelivered(
    opts.storage,
    opts.sessionId,
    opts.courseId,
  );
  if (sessionStarted && trackingEmitted && pipelineDelivered) {
    return "emitted";
  }

  const skipXapi = resolveSkipXapi(opts.storage, opts.sessionId, opts.courseId, opts.skipXapi);

  if (sessionStarted && !trackingEmitted) {
    return emitCourseStartedToTrackingOnly(opts);
  }
  if (trackingEmitted && !sessionStarted) {
    const event = buildCourseStartedEvent(opts);
    if (event === null) return "filtered";
    return emitCourseStartedPipelineOnly({ ...opts, event, skipXapi });
  }
  if (!trackingEmitted && !sessionStarted) {
    return emitCourseStarted({ ...opts, skipXapi });
  }
  if (sessionStarted && trackingEmitted && !pipelineDelivered) {
    const event = buildCourseStartedEvent(opts);
    if (event === null) return "filtered";
    return emitCourseStartedPipelineOnly({
      ...opts,
      event,
      skipXapi,
      onXapiStatementSent: opts.onXapiStatementSent,
    });
  }
  return "failed";
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
