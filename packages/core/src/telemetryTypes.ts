import type { AssessmentInteractionType } from "./assessment";
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
  | "assessment_answered"
  | "assessment_completed"
  | "interaction"
  | "book_page_viewed"
  | "compound_page_viewed"
  | "hotspot_opened"
  | "accordion_section_toggled"
  | "flashcard_flipped"
  | "image_slider_changed";

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

export type AssessmentAnsweredData = {
  checkId: CheckId;
  interactionType: AssessmentInteractionType;
  question?: string;
  response?: string | string[] | boolean | Record<string, unknown>;
  correct?: boolean;
};

export type AssessmentCompletedData = {
  checkId: CheckId;
  interactionType: AssessmentInteractionType;
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

export type BookPageViewedData = {
  blockId: BlockId;
  pageIndex: number;
  pageTitle?: string;
};

export type CompoundPageViewedData = {
  blockId: BlockId;
  pageIndex: number;
  parentType?: string;
};

export type HotspotOpenedData = {
  blockId: BlockId;
  hotspotId: string;
};

export type AccordionSectionToggledData = {
  blockId: BlockId;
  sectionId: string;
  expanded: boolean;
};

export type FlashcardFlippedData = {
  blockId: BlockId;
  cardIndex: number;
  face: "front" | "back";
};

export type ImageSliderChangedData = {
  blockId: BlockId;
  slideIndex: number;
};

export type TelemetryEvent =
  | (TelemetryEventBase & { name: "course_started"; lessonId?: LessonId; data?: undefined })
  | (TelemetryEventBase & { name: "course_completed"; lessonId?: LessonId; data?: undefined })
  | (TelemetryEventBase & { name: "lesson_started"; lessonId: LessonId; data: LessonLifecycleData })
  | (TelemetryEventBase & { name: "lesson_completed"; lessonId: LessonId; data: LessonLifecycleData })
  | (TelemetryEventBase & { name: "lesson_time_on_task"; lessonId: LessonId; data: LessonLifecycleData })
  | (TelemetryEventBase & { name: "quiz_answered"; lessonId: LessonId; data: QuizAnsweredData })
  | (TelemetryEventBase & { name: "quiz_completed"; lessonId: LessonId; data: QuizCompletedData })
  | (TelemetryEventBase & {
      name: "assessment_answered";
      lessonId: LessonId;
      data: AssessmentAnsweredData;
    })
  | (TelemetryEventBase & {
      name: "assessment_completed";
      lessonId: LessonId;
      data: AssessmentCompletedData;
    })
  | (TelemetryEventBase & { name: "interaction"; lessonId?: LessonId; data?: InteractionData })
  | (TelemetryEventBase & { name: "book_page_viewed"; lessonId: LessonId; data: BookPageViewedData })
  | (TelemetryEventBase & {
      name: "compound_page_viewed";
      lessonId: LessonId;
      data: CompoundPageViewedData;
    })
  | (TelemetryEventBase & { name: "hotspot_opened"; lessonId?: LessonId; data: HotspotOpenedData })
  | (TelemetryEventBase & {
      name: "accordion_section_toggled";
      lessonId?: LessonId;
      data: AccordionSectionToggledData;
    })
  | (TelemetryEventBase & { name: "flashcard_flipped"; lessonId?: LessonId; data: FlashcardFlippedData })
  | (TelemetryEventBase & {
      name: "image_slider_changed";
      lessonId?: LessonId;
      data: ImageSliderChangedData;
    });

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
