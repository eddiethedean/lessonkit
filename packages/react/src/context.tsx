import React, { createContext } from "react";
import type {
  CourseId,
  LessonId,
  LessonkitPlugin,
  TelemetryEventName,
  TelemetryUser,
  PluginHost,
  TrackingClient,
} from "@lessonkit/core";
import type { XAPIClient, XAPITransport } from "@lessonkit/xapi";
import type { ProgressState } from "./runtime/progress";
import { useLessonkitProviderRuntime } from "./provider/useLessonkitProviderRuntime";

export type LessonkitConfig = {
  courseId: CourseId;
  session?: {
    sessionId?: string;
    attemptId?: string;
    user?: TelemetryUser;
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
    bridge?: "auto" | "off";
  };
  /** Framework plugins (analytics, LMS, assessment, interaction, AI). */
  plugins?: LessonkitPlugin[];
  /** Runtime implementation (`v2` headless runtime is default; set `"v1"` to opt out). */
  runtimeVersion?: "v1" | "v2";
  /** Optional custom telemetry pipeline sinks (used alongside tracking/xapi). */
  sinks?: import("@lessonkit/core").TelemetryPipelineSink[];
};

export type { ProgressState };

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
  completeLesson: (lessonId: LessonId) => void;
  completeCourse: () => void;
  track: (name: TelemetryEventName, data?: unknown, opts?: { lessonId?: LessonId }) => void;
  plugins: PluginHost | null;
};

export const LessonkitContext = createContext<LessonkitRuntime | null>(null);

export function LessonkitProvider(props: { config: LessonkitConfig; children: React.ReactNode }) {
  const runtime = useLessonkitProviderRuntime(props.config);
  return <LessonkitContext.Provider value={runtime}>{props.children}</LessonkitContext.Provider>;
}
