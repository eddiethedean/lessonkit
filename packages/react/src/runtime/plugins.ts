import type {
  CourseId,
  LessonkitPlugin,
  LessonkitPluginContext,
  PluginHost,
  TelemetryEvent,
  TelemetryUser,
  TrackingClient,
} from "@lessonkit/core";
import { buildPluginContext as buildPluginContextFromCore, createPluginRegistry } from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import { emitTelemetry } from "./emitTelemetry";
import type { LxpackBridgeMode } from "./lxpackBridge";

export function createReactPluginHost(plugins: readonly LessonkitPlugin[] | undefined): PluginHost | null {
  if (!plugins?.length) return null;
  return createPluginRegistry(plugins);
}

export function buildPluginContext(opts: {
  courseId: CourseId;
  sessionId: string;
  attemptId?: string;
  user?: TelemetryUser;
}): LessonkitPluginContext {
  return buildPluginContextFromCore(opts);
}

export function emitTelemetryWithPlugins(opts: {
  pluginHost: PluginHost | null;
  tracking: TrackingClient;
  xapi: XAPIClient | null;
  event: TelemetryEvent;
  pluginCtx: LessonkitPluginContext;
  lxpackBridge?: LxpackBridgeMode;
  allowedParentOrigins?: string[];
  extraSinks?: import("@lessonkit/core").TelemetryPipelineSink[];
  onLxpackBridgeMiss?: (event: TelemetryEvent) => void;
}): void {
  const next = opts.pluginHost
    ? opts.pluginHost.runTelemetry(opts.event, opts.pluginCtx)
    : opts.event;
  if (next === null) return;
  emitTelemetry(opts.tracking, opts.xapi, next, {
    lxpackBridge: opts.lxpackBridge ?? "auto",
    allowedParentOrigins: opts.allowedParentOrigins,
    extraSinks: opts.extraSinks,
    onLxpackBridgeMiss: opts.onLxpackBridgeMiss,
  });
}
