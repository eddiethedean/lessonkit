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

