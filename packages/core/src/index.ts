export type CourseId = string;
export type LessonId = string;

export type TelemetryEventName =
  | "course_started"
  | "course_completed"
  | "lesson_started"
  | "lesson_completed"
  | "lesson_time_on_task"
  | "quiz_answered"
  | "quiz_completed"
  | "interaction";

export type TelemetryUser = {
  id?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
};

export type TelemetryEvent = {
  name: TelemetryEventName;
  timestamp: string;
  courseId?: CourseId;
  lessonId?: LessonId;
  sessionId?: string;
  attemptId?: string;
  user?: TelemetryUser;
  data?: Record<string, unknown>;
};

export type TelemetrySink = (event: TelemetryEvent) => void | Promise<void>;
export type TelemetryBatchSink = (events: TelemetryEvent[]) => void | Promise<void>;

export type TrackingClient = {
  track: (event: TelemetryEvent) => void;
  flush?: () => void;
  dispose?: () => void;
};

export function createTrackingClient(opts?: {
  sink?: TelemetrySink;
  batch?: {
    enabled?: boolean;
    flushIntervalMs?: number;
    maxBatchSize?: number;
  };
  batchSink?: TelemetryBatchSink;
}): TrackingClient {
  const sink = opts?.sink;
  const batchSink = opts?.batchSink;
  const batchEnabled = opts?.batch?.enabled ?? Boolean(batchSink);
  const flushIntervalMs = opts?.batch?.flushIntervalMs ?? 5000;
  const maxBatchSize = opts?.batch?.maxBatchSize ?? 25;

  if (!batchEnabled) {
    return {
      track: (event) => {
        void sink?.(event);
      },
    };
  }

  if (!sink && !batchSink) {
    // Batching with no sink is a black hole; default to a safe no-op.
    return { track: () => {} };
  }

  const buffer: TelemetryEvent[] = [];
  let flushInFlight: Promise<void> | null = null;

  const flush = (): void => {
    if (flushInFlight) return;
    if (!buffer.length) return;

    const events = buffer.splice(0, buffer.length);
    flushInFlight = Promise.resolve()
      .then(async () => {
        if (batchSink) {
          await batchSink(events);
          return;
        }
        for (const e of events) await sink?.(e);
      })
      .catch(() => {
        // Re-queue on any error so events aren't silently dropped.
        buffer.unshift(...events);
      })
      .finally(() => {
        flushInFlight = null;
      });
  };

  const intervalId =
    flushIntervalMs > 0 ? globalThis.setInterval(flush, flushIntervalMs) : undefined;

  return {
    track: (event) => {
      buffer.push(event);
      if (buffer.length >= maxBatchSize) flush();
    },
    flush,
    dispose: () => {
      if (intervalId !== undefined) globalThis.clearInterval(intervalId);
    },
  };
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createSessionId(): string {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return Math.random().toString(16).slice(2);
}

