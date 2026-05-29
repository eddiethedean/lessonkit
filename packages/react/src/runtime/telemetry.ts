import type { CourseId, LessonId, TelemetryEvent, TelemetryUser, TrackingClient } from "@lessonkit/core";
import { createTrackingClient } from "@lessonkit/core";
import type { ClockPort } from "./ports";

export type TelemetryConfig = {
  enabled?: boolean;
  sink?: (event: TelemetryEvent) => void | Promise<void>;
  batchSink?: (events: TelemetryEvent[]) => void | Promise<void>;
  createClient?: () => TrackingClient;
  batch?: {
    enabled?: boolean;
    flushIntervalMs?: number;
    maxBatchSize?: number;
  };
};

export function createTrackingClientFromConfig(config: { tracking?: TelemetryConfig }): TrackingClient {
  if (config.tracking?.enabled === false) return createTrackingClient();
  if (config.tracking?.createClient) return config.tracking.createClient();
  return createTrackingClient({
    sink: config.tracking?.sink,
    batchSink: config.tracking?.batchSink,
    batch: config.tracking?.batch,
  });
}

export async function disposeTrackingClient(client: TrackingClient | null | undefined): Promise<void> {
  try {
    await client?.flush?.();
  } catch {
    // ignore
  }
  try {
    await client?.dispose?.();
  } catch {
    // ignore
  }
}

export function buildTelemetryEvent(opts: {
  clock: ClockPort;
  name: TelemetryEvent["name"];
  data?: TelemetryEvent["data"];
  courseId: CourseId;
  lessonId?: LessonId;
  sessionId: string;
  attemptId?: string;
  user?: TelemetryUser;
}): TelemetryEvent {
  return {
    name: opts.name,
    timestamp: opts.clock.nowIso(),
    courseId: opts.courseId,
    lessonId: opts.lessonId,
    sessionId: opts.sessionId,
    attemptId: opts.attemptId,
    user: opts.user,
    data: opts.data,
  } as TelemetryEvent;
}

