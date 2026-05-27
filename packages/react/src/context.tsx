import React, { createContext, useCallback, useMemo, useRef, useState } from "react";
import type { CourseId, LessonId, TelemetryEvent, TrackingClient } from "@lessonkit/core";
import { createTrackingClient, nowIso } from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import { createXAPIClient } from "@lessonkit/xapi";

export type LessonkitConfig = {
  courseId?: CourseId;
  tracking?: {
    enabled?: boolean;
    sink?: (event: TelemetryEvent) => void | Promise<void>;
  };
  xapi?: {
    enabled?: boolean;
    client?: XAPIClient;
  };
};

export type ProgressState = {
  activeLessonId?: LessonId;
  completedLessonIds: Set<LessonId>;
  courseCompleted: boolean;
};

export type LessonkitRuntime = {
  config: LessonkitConfig;
  tracking: TrackingClient;
  xapi: XAPIClient | null;
  progress: ProgressState;
  setActiveLesson: (lessonId: LessonId) => void;
  completeLesson: (lessonId: LessonId) => void;
  completeCourse: () => void;
  track: (name: TelemetryEvent["name"], data?: TelemetryEvent["data"]) => void;
};

export const LessonkitContext = createContext<LessonkitRuntime | null>(null);

export function LessonkitProvider(props: { config?: LessonkitConfig; children: React.ReactNode }) {
  const config = props.config ?? {};

  const tracking = useMemo(() => {
    if (config.tracking?.enabled === false) return createTrackingClient();
    return createTrackingClient({ sink: config.tracking?.sink });
  }, [config.tracking?.enabled, config.tracking?.sink]);

  const xapi = useMemo(() => {
    if (config.xapi?.enabled === false) return null;
    return config.xapi?.client ?? createXAPIClient();
  }, [config.xapi?.enabled, config.xapi?.client]);

  const [completedLessonIds, setCompletedLessonIds] = useState<Set<LessonId>>(() => new Set());
  const [activeLessonId, setActiveLessonId] = useState<LessonId | undefined>(undefined);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const courseIdRef = useRef<CourseId | undefined>(config.courseId);
  courseIdRef.current = config.courseId;

  const track = useCallback(
    (name: TelemetryEvent["name"], data?: TelemetryEvent["data"]) => {
      tracking.track({
        name,
        timestamp: nowIso(),
        courseId: courseIdRef.current,
        lessonId: activeLessonId,
        data,
      });
    },
    [tracking, activeLessonId],
  );

  const setActiveLesson = useCallback(
    (lessonId: LessonId) => {
      setActiveLessonId(lessonId);
      track("lesson_started", { lessonId });
      xapi?.startedLesson({ lessonId });
    },
    [track, xapi],
  );

  const completeLesson = useCallback(
    (lessonId: LessonId) => {
      setCompletedLessonIds((prev) => new Set(prev).add(lessonId));
      track("lesson_completed", { lessonId });
      xapi?.completeLesson({ lessonId });
    },
    [track, xapi],
  );

  const completeCourse = useCallback(() => {
    setCourseCompleted(true);
    track("course_completed");
    xapi?.completeCourse({});
  }, [track, xapi]);

  const runtime = useMemo<LessonkitRuntime>(
    () => ({
      config,
      tracking,
      xapi,
      progress: { activeLessonId, completedLessonIds, courseCompleted },
      setActiveLesson,
      completeLesson,
      completeCourse,
      track,
    }),
    [
      config,
      tracking,
      xapi,
      activeLessonId,
      completedLessonIds,
      courseCompleted,
      setActiveLesson,
      completeLesson,
      completeCourse,
      track,
    ],
  );

  return <LessonkitContext.Provider value={runtime}>{props.children}</LessonkitContext.Provider>;
}

