import type {
  BranchNodeViewedData,
  BranchSelectedData,
  InteractionData,
  QuizAnsweredData,
  QuizCompletedData,
  TelemetryEvent,
} from "@lessonkit/core";
import type { LessonkitTelemetryEvent } from "@lxpack/tracking-schema";
import { LESSONKIT_TELEMETRY_EVENTS } from "@lxpack/tracking-schema";

/** Branch events added in LessonKit 1.5; forwarded until @lxpack/tracking-schema includes them. */
export const BRANCH_TELEMETRY_EVENTS = ["branch_node_viewed", "branch_selected"] as const;

const SUPPORTED = new Set<string>([...LESSONKIT_TELEMETRY_EVENTS, ...BRANCH_TELEMETRY_EVENTS]);

function isQuizAnsweredData(data: unknown): data is QuizAnsweredData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as QuizAnsweredData).checkId === "string" &&
    (data as QuizAnsweredData).checkId.length > 0
  );
}

function isQuizCompletedData(data: unknown): data is QuizCompletedData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as QuizCompletedData).checkId === "string" &&
    (data as QuizCompletedData).checkId.length > 0
  );
}

function isInteractionData(data: unknown): data is InteractionData {
  return typeof data === "object" && data !== null;
}

function isBranchNodeViewedData(data: unknown): data is BranchNodeViewedData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as BranchNodeViewedData).blockId === "string" &&
    typeof (data as BranchNodeViewedData).nodeId === "string"
  );
}

function isBranchSelectedData(data: unknown): data is BranchSelectedData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as BranchSelectedData).blockId === "string" &&
    typeof (data as BranchSelectedData).fromNodeId === "string" &&
    typeof (data as BranchSelectedData).toNodeId === "string"
  );
}

/**
 * Map a `@lessonkit/core` telemetry event to the LXPack LessonKit telemetry shape.
 */
export function telemetryEventToLessonkit(
  event: TelemetryEvent,
): LessonkitTelemetryEvent | null {
  if (!SUPPORTED.has(event.name)) {
    return null;
  }

  const mapped = {
    name: event.name,
    lessonId: event.lessonId,
  } as LessonkitTelemetryEvent;

  if (mapped.name === "quiz_completed" || mapped.name === "quiz_answered") {
    const data = event.data;
    if (!isQuizAnsweredData(data) && !isQuizCompletedData(data)) {
      return null;
    }
    mapped.assessmentId = data.checkId;
      if ("score" in data) {
        mapped.score = data.score;
        mapped.maxScore = data.maxScore;
        mapped.passingScore = data.passingScore;
      }
      mapped.data = data;
  } else if (mapped.name === "interaction" && event.data && isInteractionData(event.data)) {
    mapped.data = event.data;
  } else if (event.name === "branch_node_viewed" && isBranchNodeViewedData(event.data)) {
    mapped.data = event.data as Record<string, unknown>;
  } else if (event.name === "branch_selected" && isBranchSelectedData(event.data)) {
    mapped.data = event.data as Record<string, unknown>;
  }

  return mapped;
}

/** Bridge-safe track payload for branch telemetry (schema pre-1.5). */
export function branchTelemetryToBridgeTrackEvent(event: TelemetryEvent): {
  type: "interaction";
  id: string;
  data: Record<string, unknown>;
} | null {
  if (event.name === "branch_node_viewed" && isBranchNodeViewedData(event.data)) {
    return {
      type: "interaction",
      id: "branch_node_viewed",
      data: { ...event.data, lessonkitEvent: event.name },
    };
  }
  if (event.name === "branch_selected" && isBranchSelectedData(event.data)) {
    return {
      type: "interaction",
      id: "branch_selected",
      data: { ...event.data, lessonkitEvent: event.name },
    };
  }
  return null;
}
