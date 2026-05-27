export type CourseId = string;
export type LessonId = string;

export type TelemetryEventName =
  | "course_started"
  | "course_completed"
  | "lesson_started"
  | "lesson_completed"
  | "quiz_answered"
  | "quiz_completed"
  | "interaction";

export type TelemetryEvent = {
  name: TelemetryEventName;
  timestamp: string;
  courseId?: CourseId;
  lessonId?: LessonId;
  data?: Record<string, unknown>;
};

export type TelemetrySink = (event: TelemetryEvent) => void | Promise<void>;

export type TrackingClient = {
  track: (event: TelemetryEvent) => void;
};

export function createTrackingClient(opts?: { sink?: TelemetrySink }): TrackingClient {
  const sink = opts?.sink;
  return {
    track: (event) => {
      void sink?.(event);
    },
  };
}

export function nowIso(): string {
  return new Date().toISOString();
}

