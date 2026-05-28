import type { CourseId, LessonId } from "@lessonkit/core";
import { nowIso } from "@lessonkit/core";
import type { XAPIClient, XAPIQueue, XAPIStatement, XAPITransport } from "./types";
import { createInMemoryXAPIQueue } from "./queue";
import { telemetryEventToXAPIStatement } from "./telemetryMap";

export function createXAPIClient(opts?: {
  transport?: XAPITransport;
  courseId?: CourseId;
  queue?: XAPIQueue;
}): XAPIClient {
  const transport = opts?.transport;
  const courseId = opts?.courseId;
  const queue = opts?.queue ?? createInMemoryXAPIQueue();

  const sendOrQueue = (statement: XAPIStatement) => {
    if (!transport) {
      queue.enqueue(statement);
      return;
    }
    void Promise.resolve()
      .then(() => transport(statement))
      .catch(() => {
        queue.enqueue(statement);
      });
  };

  const emit = (event: Parameters<typeof telemetryEventToXAPIStatement>[0]) => {
    const statement = telemetryEventToXAPIStatement(event);
    if (statement) sendOrQueue(statement);
  };

  return {
    send: (statement) => {
      sendOrQueue(statement);
    },
    queueSize: () => queue.size(),
    flush: async () => {
      if (!transport) return;
      await queue.flush(transport);
    },
    startedLesson: ({ lessonId }: { lessonId: LessonId }) => {
      if (!courseId) return;
      emit({
        name: "lesson_started",
        timestamp: nowIso(),
        courseId,
        lessonId,
        data: { lessonId },
      });
    },
    completeLesson: ({
      lessonId,
      durationMs,
      score,
      maxScore,
      success,
    }: {
      lessonId: LessonId;
      durationMs?: number;
      score?: number;
      maxScore?: number;
      success?: boolean;
    }) => {
      if (!courseId) return;
      emit({
        name: "lesson_completed",
        timestamp: nowIso(),
        courseId,
        lessonId,
        data: { lessonId, durationMs, score, maxScore, success },
      });
    },
    completeCourse: () => {
      if (!courseId) return;
      emit({
        name: "course_completed",
        timestamp: nowIso(),
        courseId,
      });
    },
  };
}
