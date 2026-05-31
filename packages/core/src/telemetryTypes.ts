import type { BlockId, CheckId, CourseId, LessonId } from "./identityTypes";

export type { BlockId, CheckId, CourseId, LessonId } from "./identityTypes";

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

export type TelemetryEventBase = {
  timestamp: string;
  courseId: CourseId;
  sessionId?: string;
  attemptId?: string;
  user?: TelemetryUser;
};

export type LessonLifecycleData = {
  lessonId: LessonId;
  durationMs?: number;
  success?: boolean;
  score?: number;
  maxScore?: number;
};

export type QuizAnsweredData = {
  checkId: CheckId;
  question: string;
  choice: string;
  correct: boolean;
};

export type QuizCompletedData = {
  checkId: CheckId;
  score?: number;
  maxScore?: number;
  passingScore?: number;
};

export type InteractionData = {
  kind?: string;
  blockId?: BlockId;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
};

export type TelemetryEvent =
  | (TelemetryEventBase & { name: "course_started"; lessonId?: LessonId; data?: undefined })
  | (TelemetryEventBase & { name: "course_completed"; lessonId?: LessonId; data?: undefined })
  | (TelemetryEventBase & { name: "lesson_started"; lessonId: LessonId; data: LessonLifecycleData })
  | (TelemetryEventBase & { name: "lesson_completed"; lessonId: LessonId; data: LessonLifecycleData })
  | (TelemetryEventBase & { name: "lesson_time_on_task"; lessonId: LessonId; data: LessonLifecycleData })
  | (TelemetryEventBase & { name: "quiz_answered"; lessonId: LessonId; data: QuizAnsweredData })
  | (TelemetryEventBase & { name: "quiz_completed"; lessonId: LessonId; data: QuizCompletedData })
  | (TelemetryEventBase & { name: "interaction"; lessonId?: LessonId; data?: InteractionData });

/** Payload shape for a telemetry event name. */
export type TelemetryDataFor<N extends TelemetryEventName> = Extract<
  TelemetryEvent,
  { name: N }
> extends { data?: infer D }
  ? D
  : never;

export type TelemetrySink = (event: TelemetryEvent) => void | Promise<void>;
export type TelemetryBatchSink = (events: TelemetryEvent[]) => void | Promise<void>;

export type TrackingClient = {
  track: (event: TelemetryEvent) => void;
  flush?: () => void | Promise<void>;
  dispose?: () => void | Promise<void>;
};
