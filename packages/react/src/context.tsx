import React, {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CourseId, LessonId, TelemetryEventName, TelemetryUser, TrackingClient } from "@lessonkit/core";
import { createTrackingClient } from "@lessonkit/core";
import type { XAPIClient, XAPITransport } from "@lessonkit/xapi";
import { createInMemoryXAPIQueue } from "@lessonkit/xapi";
import { buildTrackEvent, emitTelemetry } from "./runtime/emitTelemetry";
import { createSessionStoragePort } from "./runtime/ports";
import { createProgressController, type ProgressState } from "./runtime/progress";
import { createXapiClientFromConfig } from "./runtime/xapi";
import { hasCourseStarted, markCourseStarted, resolveSessionId } from "./runtime/session";

export type LessonkitConfig = {
  courseId: CourseId;
  session?: {
    sessionId?: string;
    attemptId?: string;
    user?: TelemetryUser;
  };
  tracking?: {
    enabled?: boolean;
    sink?: (event: Parameters<TrackingClient["track"]>[0]) => void | Promise<void>;
    batchSink?: (events: Parameters<TrackingClient["track"]>[0][]) => void | Promise<void>;
    batch?: {
      enabled?: boolean;
      flushIntervalMs?: number;
      maxBatchSize?: number;
    };
  };
  xapi?: {
    enabled?: boolean;
    transport?: XAPITransport;
    client?: XAPIClient;
  };
};

export type { ProgressState };

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
  track: (name: TelemetryEventName, data?: unknown, opts?: { lessonId?: LessonId }) => void;
};

export const LessonkitContext = createContext<LessonkitRuntime | null>(null);

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function disposeTrackingClient(client: TrackingClient | null | undefined): void {
  client?.flush?.();
  client?.dispose?.();
}

const defaultStorage = createSessionStoragePort();

function createTrackingClientFromConfig(config: LessonkitConfig): TrackingClient {
  if (config.tracking?.enabled === false) {
    return createTrackingClient();
  }
  return createTrackingClient({
    sink: config.tracking?.sink,
    batchSink: config.tracking?.batchSink,
    batch: config.tracking?.batch,
  });
}

export function LessonkitProvider(props: { config: LessonkitConfig; children: React.ReactNode }) {
  const config = props.config;

  const sessionIdRef = useRef<string>(resolveSessionId(defaultStorage, config.session?.sessionId));
  if (config.session?.sessionId) sessionIdRef.current = config.session.sessionId;

  const attemptIdRef = useRef<string | undefined>(config.session?.attemptId);
  const userRef = useRef<TelemetryUser | undefined>(config.session?.user);
  attemptIdRef.current = config.session?.attemptId;
  userRef.current = config.session?.user;

  const courseIdRef = useRef<CourseId>(config.courseId);
  courseIdRef.current = config.courseId;

  const progressRef = useRef(createProgressController());
  const [progress, setProgress] = useState<ProgressState>(() => progressRef.current.getState());

  const syncProgress = useCallback(() => {
    setProgress(progressRef.current.getState());
  }, []);

  const activeLessonIdRef = useRef<LessonId | undefined>(progress.activeLessonId);
  activeLessonIdRef.current = progress.activeLessonId;

  const trackingRef = useRef<TrackingClient>(createTrackingClient());
  const [tracking, setTracking] = useState<TrackingClient>(() => trackingRef.current);

  const trackingEnabled = config.tracking?.enabled;
  const trackingSink = config.tracking?.sink;
  const trackingBatchSink = config.tracking?.batchSink;
  const batchEnabled = config.tracking?.batch?.enabled;
  const batchFlushIntervalMs = config.tracking?.batch?.flushIntervalMs;
  const batchMaxBatchSize = config.tracking?.batch?.maxBatchSize;

  useIsoLayoutEffect(() => {
    const prev = trackingRef.current;
    const next = createTrackingClientFromConfig(config);
    trackingRef.current = next;
    setTracking(next);

    const sessionId = sessionIdRef.current;
    const cid = courseIdRef.current;
    if (!hasCourseStarted(defaultStorage, sessionId, cid)) {
      markCourseStarted(defaultStorage, sessionId, cid);
      emitTelemetry(
        next,
        xapiRef.current,
        buildTrackEvent({
          name: "course_started",
          courseId: cid,
          sessionId,
          attemptId: attemptIdRef.current,
          user: userRef.current,
        }),
      );
    }

    return () => {
      disposeTrackingClient(prev);
    };
  }, [
    trackingEnabled,
    trackingSink,
    trackingBatchSink,
    batchEnabled,
    batchFlushIntervalMs,
    batchMaxBatchSize,
  ]);

  const xapiQueueRef = useRef(createInMemoryXAPIQueue());
  const xapiRef = useRef<XAPIClient | null>(null);
  const [xapi, setXapi] = useState<XAPIClient | null>(null);

  const xapiEnabled = config.xapi?.enabled;
  const xapiClient = config.xapi?.client;
  const xapiTransport = config.xapi?.transport;
  const courseId = config.courseId;

  useIsoLayoutEffect(() => {
    const prev = xapiRef.current;
    const next = createXapiClientFromConfig(config, xapiQueueRef.current);
    xapiRef.current = next;
    setXapi(next);
    void (async () => {
      if (prev) {
        try {
          await prev.flush();
        } catch {
          // Swallow flush errors so a broken previous transport doesn't block the next one.
        }
      }
      try {
        await next?.flush();
      } catch {
        // ignore
      }
    })();
    return () => {
      void prev?.flush();
    };
  }, [xapiEnabled, xapiClient, xapiTransport, courseId]);

  const track = useCallback(
    (name: TelemetryEventName, data?: unknown, opts?: { lessonId?: LessonId }) => {
      const event = buildTrackEvent({
        name,
        courseId: courseIdRef.current,
        lessonId: opts?.lessonId ?? activeLessonIdRef.current,
        sessionId: sessionIdRef.current,
        attemptId: attemptIdRef.current,
        user: userRef.current,
        data,
      });
      emitTelemetry(trackingRef.current, xapiRef.current, event);
    },
    [],
  );

  useEffect(() => {
    return () => {
      trackingRef.current?.flush?.();
      void xapiRef.current?.flush();
    };
  }, []);

  const emitLessonCompleted = useCallback(
    (lessonId: LessonId, durationMs?: number) => {
      track("lesson_completed", { lessonId, durationMs }, { lessonId });
      if (durationMs !== undefined) {
        track("lesson_time_on_task", { lessonId, durationMs }, { lessonId });
      }
    },
    [track],
  );

  const completeLesson = useCallback(
    (lessonId: LessonId) => {
      const result = progressRef.current.completeLesson(lessonId, Date.now());
      if (!result.didComplete) return;
      syncProgress();
      emitLessonCompleted(lessonId, result.durationMs);
    },
    [syncProgress, emitLessonCompleted],
  );

  const setActiveLesson = useCallback(
    (lessonId: LessonId) => {
      const current = progressRef.current.getState();
      if (current.activeLessonId === lessonId) return;

      const previous = current.activeLessonId;
      if (previous && previous !== lessonId) {
        const completed = progressRef.current.completeLesson(previous, Date.now());
        if (completed.didComplete) {
          emitLessonCompleted(previous, completed.durationMs);
        }
      }

      progressRef.current.setActiveLesson(lessonId, Date.now());
      syncProgress();
      track("lesson_started", { lessonId }, { lessonId });
    },
    [track, syncProgress, emitLessonCompleted],
  );

  const completeCourse = useCallback(() => {
    const result = progressRef.current.completeCourse();
    if (!result.didComplete) return;
    syncProgress();
    track("course_completed");
  }, [track, syncProgress]);

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
    [config, tracking, xapi, progress, setActiveLesson, completeLesson, completeCourse, track],
  );

  return <LessonkitContext.Provider value={runtime}>{props.children}</LessonkitContext.Provider>;
}
