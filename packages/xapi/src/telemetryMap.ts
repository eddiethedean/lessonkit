import type { TelemetryEvent } from "@lessonkit/core";
import { buildLessonkitUrn } from "@lessonkit/core";
import type { XAPIResult, XAPIStatement, XAPIVerbIri } from "./types";
import { cryptoRandomId } from "./id";
import { formatDurationMs } from "./duration";

const XAPIVerbs = {
  initialized: "http://adlnet.gov/expapi/verbs/initialized",
  completed: "http://adlnet.gov/expapi/verbs/completed",
  answered: "http://adlnet.gov/expapi/verbs/answered",
  experienced: "http://adlnet.gov/expapi/verbs/experienced",
} as const satisfies Record<string, XAPIVerbIri>;

export function buildXapiScoreResult(opts: {
  score?: number;
  maxScore?: number;
}): XAPIResult["score"] | undefined {
  const max = typeof opts.maxScore === "number" ? opts.maxScore : undefined;
  const raw = typeof opts.score === "number" ? opts.score : undefined;
  if (typeof raw !== "number" && typeof max !== "number") return undefined;
  if (
    (typeof raw === "number" && !Number.isFinite(raw)) ||
    (typeof max === "number" && !Number.isFinite(max))
  ) {
    return undefined;
  }
  if (typeof max === "number" && max <= 0) return undefined;
  if (typeof raw === "number" && raw < 0) return undefined;
  const result: NonNullable<XAPIResult["score"]> = { min: 0 };
  if (typeof raw === "number") result.raw = raw;
  if (typeof max === "number") result.max = max;
  if (
    typeof raw === "number" &&
    typeof max === "number" &&
    max > 0 &&
    raw <= max
  ) {
    result.scaled = raw / max;
  }
  return result;
}

type MapperContext = { courseId: TelemetryEvent["courseId"]; timestamp: string };

type EventMapper = (event: TelemetryEvent, ctx: MapperContext) => XAPIStatement | null;

function statementFor(
  objectId: string,
  verb: XAPIVerbIri,
  timestamp: string,
  extra?: Pick<XAPIStatement, "result" | "context">,
): XAPIStatement {
  return {
    id: cryptoRandomId(),
    timestamp,
    verb,
    object: { id: objectId },
    result: extra?.result,
    context: extra?.context,
  };
}

function experiencedBlockStatement(
  courseId: TelemetryEvent["courseId"],
  lessonId: string,
  blockId: string,
  timestamp: string,
): XAPIStatement {
  return statementFor(
    buildLessonkitUrn({ courseId, lessonId, blockId }),
    XAPIVerbs.experienced,
    timestamp,
  );
}

const experiencedBlockMapper: EventMapper = (event, ctx) => {
  if (event.name === "interaction") {
    const lessonId = event.lessonId;
    const blockId = event.data?.blockId;
    if (!lessonId || !blockId || typeof blockId !== "string") return null;
    return experiencedBlockStatement(ctx.courseId, lessonId, blockId, ctx.timestamp);
  }
  const lessonId = event.lessonId;
  const blockId = "data" in event && event.data && "blockId" in event.data ? event.data.blockId : undefined;
  if (!lessonId || !blockId || typeof blockId !== "string") return null;
  return experiencedBlockStatement(ctx.courseId, lessonId, blockId, ctx.timestamp);
};

const TELEMETRY_XAPI_MAPPERS = {
  course_started: (_event, ctx) =>
    statementFor(buildLessonkitUrn({ courseId: ctx.courseId }), XAPIVerbs.initialized, ctx.timestamp),
  course_completed: (_event, ctx) =>
    statementFor(buildLessonkitUrn({ courseId: ctx.courseId }), XAPIVerbs.completed, ctx.timestamp),
  lesson_started: (event, ctx) => {
    const lessonId = event.name === "lesson_started" ? event.lessonId : undefined;
    if (!lessonId) return null;
    return statementFor(
      buildLessonkitUrn({ courseId: ctx.courseId, lessonId }),
      XAPIVerbs.initialized,
      ctx.timestamp,
    );
  },
  lesson_completed: (event, ctx) => {
    if (event.name !== "lesson_completed") return null;
    const lessonId = event.lessonId;
    const data = event.data;
    const result: XAPIResult = {};
    if (typeof data?.durationMs === "number") {
      const duration = formatDurationMs(data.durationMs);
      if (duration !== undefined) result.duration = duration;
    }
    if (typeof data?.success === "boolean") result.success = data.success;
    const score = buildXapiScoreResult({ score: data?.score, maxScore: data?.maxScore });
    if (score) result.score = score;
    return statementFor(buildLessonkitUrn({ courseId: ctx.courseId, lessonId }), XAPIVerbs.completed, ctx.timestamp, {
      result: Object.keys(result).length ? result : undefined,
    });
  },
  lesson_time_on_task: () => null,
  quiz_answered: (event, ctx) => {
    if (event.name !== "quiz_answered") return null;
    const result: XAPIResult = {};
    if (typeof event.data.correct === "boolean") result.success = event.data.correct;
    return statementFor(
      buildLessonkitUrn({ courseId: ctx.courseId, lessonId: event.lessonId, checkId: event.data.checkId }),
      XAPIVerbs.answered,
      ctx.timestamp,
      { result: Object.keys(result).length ? result : undefined },
    );
  },
  quiz_completed: (event, ctx) => {
    if (event.name !== "quiz_completed") return null;
    const score = buildXapiScoreResult({ score: event.data.score, maxScore: event.data.maxScore });
    return statementFor(
      buildLessonkitUrn({ courseId: ctx.courseId, lessonId: event.lessonId, checkId: event.data.checkId }),
      XAPIVerbs.completed,
      ctx.timestamp,
      { result: score ? { score } : undefined },
    );
  },
  assessment_answered: (event, ctx) => {
    if (event.name !== "assessment_answered") return null;
    const result: XAPIResult = {};
    if (typeof event.data.correct === "boolean") result.success = event.data.correct;
    return statementFor(
      buildLessonkitUrn({ courseId: ctx.courseId, lessonId: event.lessonId, checkId: event.data.checkId }),
      XAPIVerbs.answered,
      ctx.timestamp,
      { result: Object.keys(result).length ? result : undefined },
    );
  },
  assessment_completed: (event, ctx) => {
    if (event.name !== "assessment_completed") return null;
    const score = buildXapiScoreResult({ score: event.data.score, maxScore: event.data.maxScore });
    return statementFor(
      buildLessonkitUrn({ courseId: ctx.courseId, lessonId: event.lessonId, checkId: event.data.checkId }),
      XAPIVerbs.completed,
      ctx.timestamp,
      { result: score ? { score } : undefined },
    );
  },
  interaction: experiencedBlockMapper,
  book_page_viewed: experiencedBlockMapper,
  slide_viewed: experiencedBlockMapper,
  compound_page_viewed: experiencedBlockMapper,
  hotspot_opened: experiencedBlockMapper,
  accordion_section_toggled: experiencedBlockMapper,
  flashcard_flipped: experiencedBlockMapper,
  image_slider_changed: experiencedBlockMapper,
  video_cue_reached: experiencedBlockMapper,
  video_segment_completed: (event, ctx) => {
    if (event.name !== "video_segment_completed") return null;
    const lessonId = event.lessonId;
    const blockId = event.data.blockId;
    if (!lessonId || !blockId) return null;
    return statementFor(
      buildLessonkitUrn({ courseId: ctx.courseId, lessonId, blockId }),
      XAPIVerbs.completed,
      ctx.timestamp,
    );
  },
  memory_card_flipped: experiencedBlockMapper,
  information_wall_search: experiencedBlockMapper,
  parallax_slide_viewed: experiencedBlockMapper,
  questionnaire_submitted: (event, ctx) => {
    if (event.name !== "questionnaire_submitted") return null;
    const lessonId = event.lessonId;
    const blockId = event.data.blockId;
    if (!lessonId || !blockId) return null;
    return statementFor(
      buildLessonkitUrn({ courseId: ctx.courseId, lessonId, blockId }),
      XAPIVerbs.completed,
      ctx.timestamp,
    );
  },
  branch_node_viewed: (event, ctx) => {
    if (event.name !== "branch_node_viewed") return null;
    const lessonId = event.lessonId;
    const blockId = event.data.blockId;
    const nodeId = event.data.nodeId;
    if (!lessonId || !blockId || !nodeId) return null;
    return statementFor(
      buildLessonkitUrn({ courseId: ctx.courseId, lessonId, blockId, nodeId }),
      XAPIVerbs.experienced,
      ctx.timestamp,
    );
  },
  branch_selected: (event, ctx) => {
    if (event.name !== "branch_selected") return null;
    const lessonId = event.lessonId;
    const blockId = event.data.blockId;
    const toNodeId = event.data.toNodeId;
    if (!lessonId || !blockId || !toNodeId) return null;
    const scored =
      typeof event.data.scoreWeight === "number" && Number.isFinite(event.data.scoreWeight);
    const verb = scored ? XAPIVerbs.answered : XAPIVerbs.experienced;
    const result = scored
      ? { score: buildXapiScoreResult({ score: event.data.scoreWeight!, maxScore: event.data.scoreWeight! }) }
      : undefined;
    return statementFor(
      buildLessonkitUrn({ courseId: ctx.courseId, lessonId, blockId, nodeId: toNodeId }),
      verb,
      ctx.timestamp,
      result?.score ? { result: result } : undefined,
    );
  },
} as const satisfies Record<TelemetryEvent["name"], EventMapper>;

/**
 * Map a LessonKit telemetry event to an xAPI statement, or null if the event should not emit xAPI.
 * `lesson_time_on_task` returns null (companion metric; lesson_completed carries duration).
 */
export function telemetryEventToXAPIStatement(event: TelemetryEvent): XAPIStatement | null {
  const mapper = TELEMETRY_XAPI_MAPPERS[event.name];
  if (!mapper) {
    throw new Error(`Unhandled telemetry event: ${(event as { name: string }).name}`);
  }
  return mapper(event, {
    courseId: event.courseId,
    timestamp: event.timestamp,
  });
}
