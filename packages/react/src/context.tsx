import React, { createContext } from "react";
import type {
  CourseId,
  LessonId,
  LessonkitPlugin,
  TelemetryDataFor,
  TelemetryEventName,
  TelemetryUser,
  PluginHost,
  TrackingClient,
} from "@lessonkit/core";
import type { XAPIClient, XAPITransport } from "@lessonkit/xapi";
import type { LxpackBridgeMode } from "@lessonkit/lxpack/bridge";
import type { ProgressState } from "./runtime/progress";
import type { LessonkitObservabilityConfig } from "./runtime/observability";
import { useLessonkitProviderRuntime } from "./provider/useLessonkitProviderRuntime";

export type { LessonkitObservabilityConfig };

export type LessonkitConfig = {
  courseId: CourseId;
  session?: {
    sessionId?: string;
    attemptId?: string;
    user?: TelemetryUser;
    /** Persist compound navigation and child state in session storage (default true). */
    persistCompoundState?: boolean;
  };
  tracking?: {
    enabled?: boolean;
    sink?: (event: Parameters<TrackingClient["track"]>[0]) => void | Promise<void>;
    batchSink?: (events: Parameters<TrackingClient["track"]>[0][]) => void | Promise<void>;
    batch?: {
      enabled?: boolean;
      flushIntervalMs?: number;
      maxBatchSize?: number;
    };
  };
  xapi?: {
    enabled?: boolean;
    transport?: XAPITransport;
    client?: XAPIClient;
  };
  lxpack?: {
    /** Forward completion events to `window.parent.lxpackBridge.v1` when embedded (default `auto`). */
    bridge?: LxpackBridgeMode;
  };
  /** Framework plugins (analytics, LMS, assessment, interaction, AI). */
  plugins?: LessonkitPlugin[];
  /** Runtime implementation (`v2` headless runtime is default; set `"v1"` to opt out). */
  runtimeVersion?: "v1" | "v2";
  /** Optional custom telemetry pipeline sinks (used alongside tracking/xapi). */
  sinks?: import("@lessonkit/core").TelemetryPipelineSink[];
  /** Production hooks for sink failures, xAPI queue depth, and LMS bridge misses. */
  observability?: LessonkitObservabilityConfig;
};

export type { ProgressState };

export type LessonkitProviderProps = {
  config: LessonkitConfig;
  children: React.ReactNode;
};

export type LessonkitRuntime = {
  config: LessonkitConfig;
  tracking: TrackingClient;
  xapi: XAPIClient | null;
  progress: ProgressState;
  session: {
    sessionId: string;
    attemptId?: string;
    user?: TelemetryUser;
  };
  setActiveLesson: (lessonId: LessonId) => void;
  completeLesson: (lessonId: LessonId, opts?: { courseId?: CourseId }) => void;
  completeCourse: () => void;
  track: <N extends TelemetryEventName>(
    name: N,
    data?: TelemetryDataFor<N>,
    opts?: { lessonId?: LessonId },
  ) => void;
  plugins: PluginHost | null;
};

export const LessonkitContext = createContext<LessonkitRuntime | null>(null);

export function LessonkitProvider(props: LessonkitProviderProps) {
  const runtime = useLessonkitProviderRuntime(props.config);
  return <LessonkitContext.Provider value={runtime}>{props.children}</LessonkitContext.Provider>;
}
