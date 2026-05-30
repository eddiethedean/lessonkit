import type { TelemetryEvent, TrackingClient } from "@lessonkit/core";
import {
  createTelemetryPipeline,
  createTrackingPipelineSink,
  type TelemetryPipeline,
} from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import { telemetryEventToXAPIStatement } from "@lessonkit/xapi";
import { forwardTelemetryToLxpack, type LxpackBridgeMode } from "./lxpackBridge";

export type LegacyEmitOptions = {
  tracking: TrackingClient;
  xapi: XAPIClient | null;
  lxpackBridge: LxpackBridgeMode;
};

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { NODE_ENV?: string } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

function createLegacyPipeline(
  opts: LegacyEmitOptions,
  extraSinks: import("@lessonkit/core").TelemetryPipelineSink[] = [],
): TelemetryPipeline {
  return createTelemetryPipeline([
    createTrackingPipelineSink("tracking", (event) => opts.tracking.track(event)),
    {
      id: "xapi",
      emit(event) {
        try {
          const statement = telemetryEventToXAPIStatement(event);
          if (statement) opts.xapi?.send(statement);
        } catch (err) {
          if (isDevEnvironment()) {
            console.warn(
              "[lessonkit] xAPI mapping skipped:",
              err instanceof Error ? err.message : err,
            );
          }
        }
      },
    },
    {
      id: "lxpack-bridge",
      emit(event) {
        forwardTelemetryToLxpack(event, opts.lxpackBridge);
      },
    },
    ...extraSinks,
  ]);
}

export function emitThroughPipeline(
  event: TelemetryEvent,
  opts: LegacyEmitOptions,
  extraSinks?: import("@lessonkit/core").TelemetryPipelineSink[],
): void {
  createLegacyPipeline(opts, extraSinks).emit(event);
}

export function createPipelineFromLegacyConfig(opts: LegacyEmitOptions): TelemetryPipeline {
  return createLegacyPipeline(opts);
}
