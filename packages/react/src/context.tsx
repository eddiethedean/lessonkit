import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CourseId, LessonId, TelemetryEvent, TelemetryUser, TrackingClient } from "@lessonkit/core";
import { createSessionId, createTrackingClient, nowIso } from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import { createXAPIClient } from "@lessonkit/xapi";

export type LessonkitConfig = {
  courseId?: CourseId;
  session?: {
    sessionId?: string;
    attemptId?: string;
    user?: TelemetryUser;
  };
  tracking?: {
    enabled?: boolean;
    sink?: (event: TelemetryEvent) => void | Promise<void>;
    batchSink?: (events: TelemetryEvent[]) => void | Promise<void>;
    batch?: {
      enabled?: boolean;
      flushIntervalMs?: number;
      maxBatchSize?: number;
    };
  };
  xapi?: {
    enabled?: boolean;
    client?: XAPIClient;
  };
};

export type ProgressState = {
  activeLessonId?: LessonId;
  completedLessonIds: ReadonlySet<LessonId>;
  courseCompleted: boolean;
};

export type LessonkitRuntime = {
  config: LessonkitConfig;
  tracking: TrackingClient;
  xapi: XAPIClient | null;
  progress: ProgressState;
  session: {
    sessionId: string;
    attemptId?: string;
    user?: TelemetryUser;
  };
  setActiveLesson: (lessonId: LessonId) => void;
  completeLesson: (lessonId: LessonId) => void;
  completeCourse: () => void;
  track: (
    name: TelemetryEvent["name"],
    data?: TelemetryEvent["data"],
    opts?: { lessonId?: LessonId },
  ) => void;
};

export const LessonkitContext = createContext<LessonkitRuntime | null>(null);

export function LessonkitProvider(props: { config?: LessonkitConfig; children: React.ReactNode }) {
  const config = props.config ?? {};

  const tracking = useMemo(() => {
    if (config.tracking?.enabled === false) return createTrackingClient();
    return createTrackingClient({
      sink: config.tracking?.sink,
      batchSink: config.tracking?.batchSink,
      batch: config.tracking?.batch,
    });
  }, [config.tracking?.enabled, config.tracking?.sink, config.tracking?.batchSink, config.tracking?.batch]);

  const xapi = useMemo(() => {
    if (config.xapi?.enabled === false) return null;
    const baseId = config.courseId ? `urn:lessonkit:course:${config.courseId}` : undefined;
    return config.xapi?.client ?? createXAPIClient({ baseId });
  }, [config.xapi?.enabled, config.xapi?.client, config.courseId]);

  const sessionIdRef = useRef<string>(config.session?.sessionId ?? createSessionId());
  const attemptIdRef = useRef<string | undefined>(config.session?.attemptId);
  const userRef = useRef<TelemetryUser | undefined>(config.session?.user);
  attemptIdRef.current = config.session?.attemptId;
  userRef.current = config.session?.user;

  const [completedLessonIds, setCompletedLessonIds] = useState<Set<LessonId>>(() => new Set());
  const [activeLessonId, setActiveLessonId] = useState<LessonId | undefined>(undefined);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const courseIdRef = useRef<CourseId | undefined>(config.courseId);
  courseIdRef.current = config.courseId;
  const lessonStartTimesRef = useRef<Map<LessonId, number>>(new Map());

  const track = useCallback(
    (name: TelemetryEvent["name"], data?: TelemetryEvent["data"], opts?: { lessonId?: LessonId }) => {
      tracking.track({
        name,
        timestamp: nowIso(),
        courseId: courseIdRef.current,
        lessonId: opts?.lessonId ?? activeLessonId,
        sessionId: sessionIdRef.current,
        attemptId: attemptIdRef.current,
        user: userRef.current,
        data,
      });
    },
    [tracking, activeLessonId],
  );

  const didStartCourseRef = useRef(false);
  useEffect(() => {
    if (!didStartCourseRef.current) {
      didStartCourseRef.current = true;
      track("course_started");
    }
    return () => tracking.dispose?.();
  }, [track, tracking]);

  const setActiveLesson = useCallback(
    (lessonId: LessonId) => {
      setActiveLessonId(lessonId);
      lessonStartTimesRef.current.set(lessonId, Date.now());
      track("lesson_started", { lessonId }, { lessonId });
      xapi?.startedLesson({ lessonId });
    },
    [track, xapi],
  );

  const completeLesson = useCallback(
    (lessonId: LessonId) => {
      setCompletedLessonIds((prev) => new Set(prev).add(lessonId));
      const startedAt = lessonStartTimesRef.current.get(lessonId);
      const durationMs = typeof startedAt === "number" ? Math.max(0, Date.now() - startedAt) : undefined;
      track("lesson_completed", { lessonId, durationMs }, { lessonId });
      if (durationMs !== undefined) {
        track("lesson_time_on_task", { lessonId, durationMs }, { lessonId });
      }
      xapi?.completeLesson({ lessonId, durationMs });
    },
    [track, xapi],
  );

  const completeCourse = useCallback(() => {
    setCourseCompleted(true);
    track("course_completed");
    xapi?.completeCourse();
  }, [track, xapi]);

  const progress = useMemo<ProgressState>(
    () => ({
      activeLessonId,
      completedLessonIds: new Set(completedLessonIds),
      courseCompleted,
    }),
    [activeLessonId, completedLessonIds, courseCompleted],
  );

  const runtime = useMemo<LessonkitRuntime>(
    () => ({
      config,
      tracking,
      xapi,
      session: { sessionId: sessionIdRef.current, attemptId: attemptIdRef.current, user: userRef.current },
      progress,
      setActiveLesson,
      completeLesson,
      completeCourse,
      track,
    }),
    [
      config,
      tracking,
      xapi,
      progress,
      setActiveLesson,
      completeLesson,
      completeCourse,
      track,
    ],
  );

  return <LessonkitContext.Provider value={runtime}>{props.children}</LessonkitContext.Provider>;
}

