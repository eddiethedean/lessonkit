import type {
  BuildTelemetryEventContext,
  BuildTelemetryEventInput,
} from "./buildInput";
import type {
  AccordionSectionToggledData,
  AssessmentAnsweredData,
  AssessmentCompletedData,
  BookPageViewedData,
  CompoundPageViewedData,
  FlashcardFlippedData,
  HotspotOpenedData,
  ImageSliderChangedData,
  InteractionData,
  LessonId,
  LessonLifecycleData,
  QuizAnsweredData,
  QuizCompletedData,
  TelemetryEvent,
} from "../telemetryTypes";
import { nowIso } from "../time";

type EventBase = BuildTelemetryEventContext & { timestamp: string };

function resolveLessonId(
  opts: { lessonId?: LessonId; data?: LessonLifecycleData },
  eventName: string,
): LessonId {
  const lessonId = opts.lessonId ?? opts.data?.lessonId;
  if (!lessonId) throw new Error(`${eventName} requires lessonId`);
  return lessonId;
}

function withLessonScopedData<N extends string, D>(
  name: N,
  base: EventBase,
  lessonId: LessonId,
  data?: D,
): TelemetryEvent {
  return { name, ...base, lessonId, data: { ...data, lessonId } } as TelemetryEvent;
}

type EventRegistryEntry = {
  requiresLessonId?: boolean;
  tryBuildMissingLessonWarning?: "quiz" | "assessment";
  build: (opts: BuildTelemetryEventInput, base: EventBase) => TelemetryEvent;
};

export const TELEMETRY_EVENT_REGISTRY: Record<BuildTelemetryEventInput["name"], EventRegistryEntry> = {
  course_started: {
    build: (_opts, base) => ({ name: "course_started", ...base }),
  },
  course_completed: {
    build: (_opts, base) => ({ name: "course_completed", ...base }),
  },
  lesson_started: {
    requiresLessonId: true,
    build: (opts, base) => {
      if (opts.name !== "lesson_started") throw new Error("unexpected event");
      const lessonId = resolveLessonId(opts, "lesson_started");
      return withLessonScopedData("lesson_started", base, lessonId, opts.data);
    },
  },
  lesson_completed: {
    requiresLessonId: true,
    build: (opts, base) => {
      if (opts.name !== "lesson_completed") throw new Error("unexpected event");
      const lessonId = resolveLessonId(opts, opts.name);
      return withLessonScopedData(opts.name, base, lessonId, opts.data);
    },
  },
  lesson_time_on_task: {
    requiresLessonId: true,
    build: (opts, base) => {
      if (opts.name !== "lesson_time_on_task") throw new Error("unexpected event");
      const lessonId = resolveLessonId(opts, opts.name);
      return withLessonScopedData(opts.name, base, lessonId, opts.data);
    },
  },
  quiz_answered: {
    requiresLessonId: true,
    tryBuildMissingLessonWarning: "quiz",
    build: (opts, base) => {
      if (opts.name !== "quiz_answered") throw new Error("unexpected event");
      const lessonId = opts.lessonId;
      if (!lessonId) throw new Error("quiz_answered requires active lessonId");
      return {
        name: "quiz_answered",
        ...base,
        lessonId,
        data: opts.data as QuizAnsweredData,
      };
    },
  },
  quiz_completed: {
    requiresLessonId: true,
    tryBuildMissingLessonWarning: "quiz",
    build: (opts, base) => {
      if (opts.name !== "quiz_completed") throw new Error("unexpected event");
      const lessonId = opts.lessonId;
      if (!lessonId) throw new Error("quiz_completed requires active lessonId");
      return {
        name: "quiz_completed",
        ...base,
        lessonId,
        data: opts.data as QuizCompletedData,
      };
    },
  },
  assessment_answered: {
    requiresLessonId: true,
    tryBuildMissingLessonWarning: "assessment",
    build: (opts, base) => {
      if (opts.name !== "assessment_answered") throw new Error("unexpected event");
      const lessonId = opts.lessonId;
      if (!lessonId) throw new Error("assessment_answered requires active lessonId");
      return {
        name: "assessment_answered",
        ...base,
        lessonId,
        data: opts.data as AssessmentAnsweredData,
      };
    },
  },
  assessment_completed: {
    requiresLessonId: true,
    tryBuildMissingLessonWarning: "assessment",
    build: (opts, base) => {
      if (opts.name !== "assessment_completed") throw new Error("unexpected event");
      const lessonId = opts.lessonId;
      if (!lessonId) throw new Error("assessment_completed requires active lessonId");
      return {
        name: "assessment_completed",
        ...base,
        lessonId,
        data: opts.data as AssessmentCompletedData,
      };
    },
  },
  interaction: {
    build: (opts, base) => {
      if (opts.name !== "interaction") throw new Error("unexpected event");
      return {
        name: "interaction",
        ...base,
        lessonId: opts.lessonId,
        data: opts.data as InteractionData | undefined,
      };
    },
  },
  book_page_viewed: {
    requiresLessonId: true,
    build: (opts, base) => {
      if (opts.name !== "book_page_viewed") throw new Error("unexpected event");
      const lessonId = opts.lessonId;
      if (!lessonId) throw new Error("book_page_viewed requires active lessonId");
      return {
        name: "book_page_viewed",
        ...base,
        lessonId,
        data: opts.data as BookPageViewedData,
      };
    },
  },
  compound_page_viewed: {
    requiresLessonId: true,
    build: (opts, base) => {
      if (opts.name !== "compound_page_viewed") throw new Error("unexpected event");
      const lessonId = opts.lessonId;
      if (!lessonId) throw new Error("compound_page_viewed requires active lessonId");
      return {
        name: "compound_page_viewed",
        ...base,
        lessonId,
        data: opts.data as CompoundPageViewedData,
      };
    },
  },
  hotspot_opened: {
    build: (opts, base) => {
      if (opts.name !== "hotspot_opened") throw new Error("unexpected event");
      return {
        name: "hotspot_opened",
        ...base,
        lessonId: opts.lessonId,
        data: opts.data as HotspotOpenedData,
      };
    },
  },
  accordion_section_toggled: {
    build: (opts, base) => {
      if (opts.name !== "accordion_section_toggled") throw new Error("unexpected event");
      return {
        name: "accordion_section_toggled",
        ...base,
        lessonId: opts.lessonId,
        data: opts.data as AccordionSectionToggledData,
      };
    },
  },
  flashcard_flipped: {
    build: (opts, base) => {
      if (opts.name !== "flashcard_flipped") throw new Error("unexpected event");
      return {
        name: "flashcard_flipped",
        ...base,
        lessonId: opts.lessonId,
        data: opts.data as FlashcardFlippedData,
      };
    },
  },
  image_slider_changed: {
    build: (opts, base) => {
      if (opts.name !== "image_slider_changed") throw new Error("unexpected event");
      return {
        name: "image_slider_changed",
        ...base,
        lessonId: opts.lessonId,
        data: opts.data as ImageSliderChangedData,
      };
    },
  },
};

export function buildTelemetryEventFromRegistry(opts: BuildTelemetryEventInput): TelemetryEvent {
  const entry = TELEMETRY_EVENT_REGISTRY[opts.name];
  if (!entry) {
    throw new Error("Unexpected value");
  }
  const base: EventBase = {
    timestamp: opts.timestamp ?? nowIso(),
    courseId: opts.courseId,
    sessionId: opts.sessionId,
    attemptId: opts.attemptId,
    user: opts.user,
  };
  return entry.build(opts, base);
}

export function getTelemetryEventRegistryEntry(name: BuildTelemetryEventInput["name"]): EventRegistryEntry {
  return TELEMETRY_EVENT_REGISTRY[name];
}
