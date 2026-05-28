import React, {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CourseId, LessonId, TelemetryEvent, TelemetryUser, TrackingClient } from "@lessonkit/core";
import { createSessionId, createTrackingClient, nowIso } from "@lessonkit/core";
import type { XAPIClient, XAPITransport } from "@lessonkit/xapi";
import { createInMemoryXAPIQueue, createXAPIClient } from "@lessonkit/xapi";
import type { XAPIQueue } from "@lessonkit/xapi";

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
    transport?: XAPITransport;
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

const SESSION_STORAGE_KEY = "lessonkit:sessionId";
const COURSE_STARTED_PREFIX = "lessonkit:course_started:";

function disposeTrackingClient(client: TrackingClient | null | undefined): void {
  client?.flush?.();
  client?.dispose?.();
}

function safeSessionStorageGetItem(key: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionStorageSetItem(key: string, value: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Storage can throw (e.g. blocked/disabled storage). Treat as non-fatal.
  }
}

function resolveSessionId(provided?: string): string {
  if (provided) return provided;
  const existing = safeSessionStorageGetItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const id = createSessionId();
  safeSessionStorageSetItem(SESSION_STORAGE_KEY, id);
  return id;
}

function courseStartedStorageKey(sessionId: string, courseId?: CourseId): string {
  return `${COURSE_STARTED_PREFIX}${sessionId}:${courseId ?? ""}`;
}

function hasCourseStarted(sessionId: string, courseId?: CourseId): boolean {
  if (!courseId) return false;
  return safeSessionStorageGetItem(courseStartedStorageKey(sessionId, courseId)) === "1";
}

function markCourseStarted(sessionId: string, courseId?: CourseId): void {
  if (!courseId) return;
  safeSessionStorageSetItem(courseStartedStorageKey(sessionId, courseId), "1");
}

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

function createXapiClientFromConfig(config: LessonkitConfig, queue: XAPIQueue): XAPIClient | null {
  if (config.xapi?.enabled === false) return null;
  if (config.xapi?.client) return config.xapi.client;
  const baseId = config.courseId ? `urn:lessonkit:course:${config.courseId}` : undefined;
  return createXAPIClient({ baseId, transport: config.xapi?.transport, queue });
}

export function LessonkitProvider(props: { config?: LessonkitConfig; children: React.ReactNode }) {
  const config = props.config ?? {};

  const sessionIdRef = useRef<string>(resolveSessionId(config.session?.sessionId));
  if (config.session?.sessionId) sessionIdRef.current = config.session.sessionId;

  const attemptIdRef = useRef<string | undefined>(config.session?.attemptId);
  const userRef = useRef<TelemetryUser | undefined>(config.session?.user);
  attemptIdRef.current = config.session?.attemptId;
  userRef.current = config.session?.user;

  const courseIdRef = useRef<CourseId | undefined>(config.courseId);
  courseIdRef.current = config.courseId;

  const trackingRef = useRef<TrackingClient>(createTrackingClient());
  const [tracking, setTracking] = useState<TrackingClient>(() => trackingRef.current);
  const courseStartedInProviderRef = useRef(false);

  const trackingEnabled = config.tracking?.enabled;
  const trackingSink = config.tracking?.sink;
  const trackingBatchSink = config.tracking?.batchSink;
  const batchEnabled = config.tracking?.batch?.enabled;
  const batchFlushIntervalMs = config.tracking?.batch?.flushIntervalMs;
  const batchMaxBatchSize = config.tracking?.batch?.maxBatchSize;

  useLayoutEffect(() => {
    const prev = trackingRef.current;
    const next = createTrackingClientFromConfig(config);
    trackingRef.current = next;
    setTracking(next);

    const sessionId = sessionIdRef.current;
    const cid = courseIdRef.current;
    const shouldEmitCourseStarted = cid ? !hasCourseStarted(sessionId, cid) : !courseStartedInProviderRef.current;
    if (shouldEmitCourseStarted) {
      if (cid) {
        markCourseStarted(sessionId, cid);
      } else {
        courseStartedInProviderRef.current = true;
      }
      next.track({
        name: "course_started",
        timestamp: nowIso(),
        courseId: cid,
        sessionId,
        attemptId: attemptIdRef.current,
        user: userRef.current,
      });
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

  useLayoutEffect(() => {
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

  const [completedLessonIds, setCompletedLessonIds] = useState<Set<LessonId>>(() => new Set());
  const completedLessonIdsRef = useRef<Set<LessonId>>(completedLessonIds);
  completedLessonIdsRef.current = completedLessonIds;

  const [activeLessonId, setActiveLessonId] = useState<LessonId | undefined>(undefined);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const courseCompletedRef = useRef(false);
  courseCompletedRef.current = courseCompleted;

  const activeLessonIdRef = useRef<LessonId | undefined>(undefined);
  activeLessonIdRef.current = activeLessonId;
  const lessonStartTimesRef = useRef<Map<LessonId, number>>(new Map());

  const track = useCallback(
    (name: TelemetryEvent["name"], data?: TelemetryEvent["data"], opts?: { lessonId?: LessonId }) => {
      trackingRef.current?.track({
        name,
        timestamp: nowIso(),
        courseId: courseIdRef.current,
        lessonId: opts?.lessonId ?? activeLessonIdRef.current,
        sessionId: sessionIdRef.current,
        attemptId: attemptIdRef.current,
        user: userRef.current,
        data,
      });
    },
    [],
  );

  useEffect(() => {
    return () => {
      trackingRef.current?.flush?.();
      void xapiRef.current?.flush();
    };
  }, []);

  const setActiveLesson = useCallback((lessonId: LessonId) => {
    if (activeLessonIdRef.current === lessonId) return;
    activeLessonIdRef.current = lessonId;
    setActiveLessonId(lessonId);
    lessonStartTimesRef.current.set(lessonId, Date.now());
    track("lesson_started", { lessonId }, { lessonId });
    xapiRef.current?.startedLesson({ lessonId });
  }, [track]);

  const completeLesson = useCallback(
    (lessonId: LessonId) => {
      if (completedLessonIdsRef.current.has(lessonId)) return;
      completedLessonIdsRef.current = new Set(completedLessonIdsRef.current).add(lessonId);
      setCompletedLessonIds(completedLessonIdsRef.current);

      const startedAt = lessonStartTimesRef.current.get(lessonId);
      lessonStartTimesRef.current.delete(lessonId);
      const durationMs = typeof startedAt === "number" ? Math.max(0, Date.now() - startedAt) : undefined;
      track("lesson_completed", { lessonId, durationMs }, { lessonId });
      if (durationMs !== undefined) {
        track("lesson_time_on_task", { lessonId, durationMs }, { lessonId });
      }
      xapiRef.current?.completeLesson({ lessonId, durationMs });
    },
    [track],
  );

  const completeCourse = useCallback(() => {
    if (courseCompletedRef.current) return;
    courseCompletedRef.current = true;
    setCourseCompleted(true);
    track("course_completed");
    xapiRef.current?.completeCourse();
  }, [track]);

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
    [config, tracking, xapi, progress, setActiveLesson, completeLesson, completeCourse, track],
  );

  return <LessonkitContext.Provider value={runtime}>{props.children}</LessonkitContext.Provider>;
}
