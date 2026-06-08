import type {
  AccordionSectionToggledData,
  AssessmentAnsweredData,
  AssessmentCompletedData,
  BookPageViewedData,
  SlideViewedData,
  CompoundPageViewedData,
  CourseId,
  FlashcardFlippedData,
  HotspotOpenedData,
  ImageSliderChangedData,
  InteractionData,
  LessonId,
  LessonLifecycleData,
  MemoryCardFlippedData,
  InformationWallSearchData,
  ParallaxSlideViewedData,
  QuestionnaireSubmittedData,
  BranchNodeViewedData,
  BranchSelectedData,
  ImageJuxtapositionChangedData,
  TimelineEventViewedData,
  ImageSequenceChangedData,
  AudioRecordingData,
  QrContentRevealedData,
  AdventDoorOpenedData,
  MapStageViewedData,
  MapExitSelectedData,
  QuizAnsweredData,
  QuizCompletedData,
  TelemetryUser,
  VideoCueReachedData,
  VideoSegmentCompletedData,
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
      name: "slide_viewed";
      lessonId?: LessonId;
      data: SlideViewedData;
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
    })
  | (BuildTelemetryEventContext & {
      name: "video_cue_reached";
      lessonId?: LessonId;
      data: VideoCueReachedData;
    })
  | (BuildTelemetryEventContext & {
      name: "video_segment_completed";
      lessonId?: LessonId;
      data: VideoSegmentCompletedData;
    })
  | (BuildTelemetryEventContext & {
      name: "memory_card_flipped";
      lessonId?: LessonId;
      data: MemoryCardFlippedData;
    })
  | (BuildTelemetryEventContext & {
      name: "information_wall_search";
      lessonId?: LessonId;
      data: InformationWallSearchData;
    })
  | (BuildTelemetryEventContext & {
      name: "parallax_slide_viewed";
      lessonId?: LessonId;
      data: ParallaxSlideViewedData;
    })
  | (BuildTelemetryEventContext & {
      name: "questionnaire_submitted";
      lessonId?: LessonId;
      data: QuestionnaireSubmittedData;
    })
  | (BuildTelemetryEventContext & {
      name: "branch_node_viewed";
      lessonId?: LessonId;
      data: BranchNodeViewedData;
    })
  | (BuildTelemetryEventContext & {
      name: "branch_selected";
      lessonId?: LessonId;
      data: BranchSelectedData;
    })
  | (BuildTelemetryEventContext & {
      name: "image_juxtaposition_changed";
      lessonId?: LessonId;
      data: ImageJuxtapositionChangedData;
    })
  | (BuildTelemetryEventContext & {
      name: "timeline_event_viewed";
      lessonId?: LessonId;
      data: TimelineEventViewedData;
    })
  | (BuildTelemetryEventContext & {
      name: "image_sequence_changed";
      lessonId?: LessonId;
      data: ImageSequenceChangedData;
    })
  | (BuildTelemetryEventContext & {
      name: "audio_recording_started";
      lessonId?: LessonId;
      data: AudioRecordingData;
    })
  | (BuildTelemetryEventContext & {
      name: "audio_recording_completed";
      lessonId?: LessonId;
      data: AudioRecordingData;
    })
  | (BuildTelemetryEventContext & {
      name: "qr_content_revealed";
      lessonId?: LessonId;
      data: QrContentRevealedData;
    })
  | (BuildTelemetryEventContext & {
      name: "advent_door_opened";
      lessonId?: LessonId;
      data: AdventDoorOpenedData;
    })
  | (BuildTelemetryEventContext & {
      name: "map_stage_viewed";
      lessonId?: LessonId;
      data: MapStageViewedData;
    })
  | (BuildTelemetryEventContext & {
      name: "map_exit_selected";
      lessonId?: LessonId;
      data: MapExitSelectedData;
    });
