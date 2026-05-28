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
    let disposed = false;
    return {
      track: (event) => {
        if (disposed) return;
        void sink?.(event);
      },
      dispose: () => {
        disposed = true;
      },
    };
  }

  if (!sink && !batchSink) {
    // Batching with no sink is a black hole; default to a safe no-op.
    return { track: () => {} };
  }

  const buffer: TelemetryEvent[] = [];
  let flushInFlight: Promise<void> | null = null;
  let disposed = false;
  let intervalId: ReturnType<typeof globalThis.setInterval> | undefined;

  const flush = (): void => {
    if (disposed || flushInFlight) return;
    if (!buffer.length) return;

    const events = buffer.splice(0, buffer.length);
    let sent = 0;
    let succeeded = false;
    flushInFlight = Promise.resolve()
      .then(async () => {
        if (batchSink) {
          await batchSink(events);
        } else {
          // If per-event sink throws partway through, only re-queue the unsent tail.
          for (const e of events) {
            await sink?.(e);
            sent += 1;
          }
        }
        succeeded = true;
      })
      .catch(() => {
        // Re-queue on any error so events aren't silently dropped.
        // If failure occurred after some per-event sends, only re-queue what wasn't sent yet.
        buffer.unshift(...events.slice(sent));
      })
      .finally(() => {
        flushInFlight = null;
        if (succeeded && !disposed && buffer.length > 0) flush();
      });
  };

  intervalId =
    flushIntervalMs > 0 ? globalThis.setInterval(flush, flushIntervalMs) : undefined;

  return {
    track: (event) => {
      if (disposed) return;
      buffer.push(event);
      if (buffer.length >= maxBatchSize) flush();
    },
    flush,
    dispose: () => {
      if (disposed) return;
      if (intervalId !== undefined) {
        globalThis.clearInterval(intervalId);
        intervalId = undefined;
      }
      flush();
      disposed = true;
    },
  };
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createSessionId(): string {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}
