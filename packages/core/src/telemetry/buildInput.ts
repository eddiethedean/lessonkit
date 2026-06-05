import type {
  AccordionSectionToggledData,
  AssessmentAnsweredData,
  AssessmentCompletedData,
  BookPageViewedData,
  CompoundPageViewedData,
  CourseId,
  FlashcardFlippedData,
  HotspotOpenedData,
  ImageSliderChangedData,
  InteractionData,
  LessonId,
  LessonLifecycleData,
  QuizAnsweredData,
  QuizCompletedData,
  TelemetryUser,
} from "../telemetryTypes";

export type BuildTelemetryEventContext = {
  courseId: CourseId;
  sessionId?: string;
  attemptId?: string;
  user?: TelemetryUser;
  timestamp?: string;
};

export type BuildTelemetryEventInput =
  | (BuildTelemetryEventContext & { name: "course_started"; lessonId?: LessonId; data?: undefined })
  | (BuildTelemetryEventContext & { name: "course_completed"; lessonId?: LessonId; data?: undefined })
  | (BuildTelemetryEventContext & {
      name: "lesson_started";
      lessonId?: LessonId;
      data?: LessonLifecycleData;
    })
  | (BuildTelemetryEventContext & {
      name: "lesson_completed";
      lessonId?: LessonId;
      data?: LessonLifecycleData;
    })
  | (BuildTelemetryEventContext & {
      name: "lesson_time_on_task";
      lessonId?: LessonId;
      data?: LessonLifecycleData;
    })
  | (BuildTelemetryEventContext & {
      name: "quiz_answered";
      lessonId?: LessonId;
      data: QuizAnsweredData;
    })
  | (BuildTelemetryEventContext & {
      name: "quiz_completed";
      lessonId?: LessonId;
      data: QuizCompletedData;
    })
  | (BuildTelemetryEventContext & {
      name: "assessment_answered";
      lessonId?: LessonId;
      data: AssessmentAnsweredData;
    })
  | (BuildTelemetryEventContext & {
      name: "assessment_completed";
      lessonId?: LessonId;
      data: AssessmentCompletedData;
    })
  | (BuildTelemetryEventContext & {
      name: "interaction";
      lessonId?: LessonId;
      data?: InteractionData;
    })
  | (BuildTelemetryEventContext & {
      name: "book_page_viewed";
      lessonId?: LessonId;
      data: BookPageViewedData;
    })
  | (BuildTelemetryEventContext & {
      name: "compound_page_viewed";
      lessonId?: LessonId;
      data: CompoundPageViewedData;
    })
  | (BuildTelemetryEventContext & {
      name: "hotspot_opened";
      lessonId?: LessonId;
      data: HotspotOpenedData;
    })
  | (BuildTelemetryEventContext & {
      name: "accordion_section_toggled";
      lessonId?: LessonId;
      data: AccordionSectionToggledData;
    })
  | (BuildTelemetryEventContext & {
      name: "flashcard_flipped";
      lessonId?: LessonId;
      data: FlashcardFlippedData;
    })
  | (BuildTelemetryEventContext & {
      name: "image_slider_changed";
      lessonId?: LessonId;
      data: ImageSliderChangedData;
    });
