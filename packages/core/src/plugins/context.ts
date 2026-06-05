import type { CourseId, TelemetryUser } from "../telemetryTypes";
import type { LessonkitPluginContext } from "./types";

export function buildPluginContext(opts: {
  courseId: CourseId;
  sessionId?: string;
  attemptId?: string;
  user?: TelemetryUser;
}): LessonkitPluginContext {
  return {
    courseId: opts.courseId,
    sessionId: opts.sessionId,
    attemptId: opts.attemptId,
    user: opts.user,
  };
}
