import React, {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CourseId,
  LessonId,
  LessonkitPlugin,
  TelemetryEvent,
  TelemetryEventName,
  TelemetryUser,
  PluginHost,
  TrackingClient,
} from "@lessonkit/core";
import { createTrackingClient } from "@lessonkit/core";
import type { XAPIClient, XAPITransport } from "@lessonkit/xapi";
import { createInMemoryXAPIQueue } from "@lessonkit/xapi";
import { telemetryEventToXAPIStatement } from "@lessonkit/xapi";
import { buildTrackEvent, emitTelemetry, tryBuildTrackEvent } from "./runtime/emitTelemetry";
import type { LxpackBridgeMode } from "./runtime/lxpackBridge";
import { createSessionStoragePort } from "./runtime/ports";
import { createProgressController, type ProgressState } from "./runtime/progress";
import { createXapiClientFromConfig } from "./runtime/xapi";
import {
  getTabSessionId,
  hasCourseStarted,
  markCourseStarted,
  migrateCourseStartedMark,
  resolveSessionId,
} from "./runtime/session";
import {
  buildPluginContext,
  createReactPluginHost,
  emitTelemetryWithPlugins,
} from "./runtime/plugins";
import { createTrackingClientFromConfig, disposeTrackingClient } from "./runtime/telemetry";

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
  lxpack?: {
    /** Forward completion events to `window.parent.lxpackBridge.v1` when embedded (default `auto`). */
    bridge?: "auto" | "off";
  };
  /** Framework plugins (analytics, LMS, assessment, interaction, AI). */
  plugins?: LessonkitPlugin[];
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
  plugins: PluginHost | null;
};

export const LessonkitContext = createContext<LessonkitRuntime | null>(null);

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const defaultStorage = createSessionStoragePort();

function isTrackingActive(tracking?: LessonkitConfig["tracking"]): boolean {
  return tracking?.enabled !== false;
}

export function LessonkitProvider(props: { config: LessonkitConfig; children: React.ReactNode }) {
  const config = props.config;

  const sessionIdRef = useRef<string>(resolveSessionId(defaultStorage, config.session?.sessionId));
  const prevConfiguredSessionIdRef = useRef<string | undefined>(config.session?.sessionId);
  if (config.session?.sessionId) {
    sessionIdRef.current = config.session.sessionId;
  } else if (prevConfiguredSessionIdRef.current) {
    sessionIdRef.current = resolveSessionId(defaultStorage, undefined);
  }

  const attemptIdRef = useRef<string | undefined>(config.session?.attemptId);
  const userRef = useRef<TelemetryUser | undefined>(config.session?.user);
  attemptIdRef.current = config.session?.attemptId;
  userRef.current = config.session?.user;

  const courseIdRef = useRef<CourseId>(config.courseId);
  courseIdRef.current = config.courseId;

  const lxpackBridgeModeRef = useRef<LxpackBridgeMode>(config.lxpack?.bridge ?? "auto");
  lxpackBridgeModeRef.current = config.lxpack?.bridge ?? "auto";

  const pluginHost = useMemo(() => createReactPluginHost(config.plugins), [config.plugins]);
  const pluginHostRef = useRef(pluginHost);
  pluginHostRef.current = pluginHost;

  const progressRef = useRef(createProgressController());
  const courseStartedEmittedToSinkRef = useRef(false);
  const prevCourseIdForProgressRef = useRef(config.courseId);
  const pendingCourseIdResetRef = useRef(false);
  if (prevCourseIdForProgressRef.current !== config.courseId) {
    prevCourseIdForProgressRef.current = config.courseId;
    progressRef.current = createProgressController();
    pendingCourseIdResetRef.current = true;
    courseStartedEmittedToSinkRef.current = false;
  }

  const [progress, setProgress] = useState<ProgressState>(() => progressRef.current.getState());

  const syncProgress = useCallback(() => {
    setProgress(progressRef.current.getState());
  }, []);

  const activeLessonIdRef = useRef<LessonId | undefined>(progress.activeLessonId);
  activeLessonIdRef.current = progress.activeLessonId;

  const xapiQueueRef = useRef(createInMemoryXAPIQueue());
  const xapiRef = useRef<XAPIClient | null>(null);
  const [xapi, setXapi] = useState<XAPIClient | null>(null);
  const prevXapiCourseIdRef = useRef(config.courseId);

  const xapiEnabled = config.xapi?.enabled;
  const xapiClient = config.xapi?.client;
  const xapiTransport = config.xapi?.transport;
  const courseId = config.courseId;
  const trackingEnabled = config.tracking?.enabled;

  useIsoLayoutEffect(() => {
    if (prevXapiCourseIdRef.current !== courseId) {
      xapiQueueRef.current = createInMemoryXAPIQueue();
      prevXapiCourseIdRef.current = courseId;
    }

    const prev = xapiRef.current;
    const next = createXapiClientFromConfig(config, xapiQueueRef.current);
    xapiRef.current = next;
    setXapi(next);

    if (next && !prev) {
      const sessionId = sessionIdRef.current;
      const cid = courseIdRef.current;
      const trackingActive = isTrackingActive(config.tracking);
      const alreadyStarted = hasCourseStarted(defaultStorage, sessionId, cid);
      // When tracking is on, course_started (and xAPI) normally flow through emitTelemetry.
      // Bootstrap here only for xAPI-only apps, or when transport is enabled after course_started.
      if (!trackingActive || alreadyStarted) {
        try {
          const statement = telemetryEventToXAPIStatement(
            buildTrackEvent({
              name: "course_started",
              courseId: cid,
              sessionId,
              attemptId: attemptIdRef.current,
              user: userRef.current,
            }),
          );
          if (statement) next.send(statement);
        } catch {
          // xAPI mapping may skip invalid ids; ignore
        }
      }
    }

    let cancelled = false;
    void (async () => {
      if (prev) {
        try {
          await prev.flush();
        } catch {
          // Swallow flush errors so a broken previous transport doesn't block the next one.
        }
      }
      if (cancelled) return;
      try {
        await next?.flush();
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
      void prev?.flush();
    };
  }, [xapiEnabled, xapiClient, xapiTransport, courseId, trackingEnabled]);

  const trackingRef = useRef<TrackingClient>(createTrackingClient());
  const trackingClientForUnmountRef = useRef<TrackingClient>(trackingRef.current);
  const [tracking, setTracking] = useState<TrackingClient>(() => trackingRef.current);

  const trackingSink = config.tracking?.sink;
  const trackingBatchSink = config.tracking?.batchSink;
  const batchEnabled = config.tracking?.batch?.enabled;
  const batchFlushIntervalMs = config.tracking?.batch?.flushIntervalMs;
  const batchMaxBatchSize = config.tracking?.batch?.maxBatchSize;

  useIsoLayoutEffect(() => {
    const prev = trackingRef.current;
    const pluginCtx = buildPluginContext({
      courseId: courseIdRef.current,
      sessionId: sessionIdRef.current,
      attemptId: attemptIdRef.current,
    });
    const sink =
      pluginHostRef.current?.composeTrackingSink(config.tracking?.sink, pluginCtx) ??
      config.tracking?.sink;
    const batchSink =
      pluginHostRef.current && config.tracking?.batchSink
        ? (events: TelemetryEvent[]) => {
            const filtered = pluginHostRef.current!.runTelemetryBatch(events, pluginCtx);
            return config.tracking!.batchSink!(filtered);
          }
        : config.tracking?.batchSink;
    const next = createTrackingClientFromConfig({
      tracking: { ...config.tracking, sink, batchSink },
    });
    trackingRef.current = next;
    trackingClientForUnmountRef.current = next;
    setTracking(next);

    const sessionId = sessionIdRef.current;
    const cid = courseIdRef.current;
    const trackingActive = isTrackingActive(config.tracking);

    if (!trackingActive) {
      courseStartedEmittedToSinkRef.current = false;
    } else if (
      !courseStartedEmittedToSinkRef.current &&
      !hasCourseStarted(defaultStorage, sessionId, cid)
    ) {
      markCourseStarted(defaultStorage, sessionId, cid);
      emitTelemetryWithPlugins({
        pluginHost: pluginHostRef.current,
        tracking: next,
        xapi: xapiRef.current,
        event: buildTrackEvent({
          name: "course_started",
          courseId: cid,
          sessionId,
          attemptId: attemptIdRef.current,
          user: userRef.current,
        }),
        pluginCtx: buildPluginContext({
          courseId: cid,
          sessionId,
          attemptId: attemptIdRef.current,
        }),
        lxpackBridge: lxpackBridgeModeRef.current,
      });
      courseStartedEmittedToSinkRef.current = true;
    } else if (trackingActive) {
      courseStartedEmittedToSinkRef.current = true;
    }

    return () => {
      if (prev !== trackingRef.current) {
        disposeTrackingClient(prev);
      }
    };
  }, [
    trackingEnabled,
    trackingSink,
    trackingBatchSink,
    batchEnabled,
    batchFlushIntervalMs,
    batchMaxBatchSize,
    config.plugins,
  ]);

  const emitWithBridge = useCallback((trackingClient: TrackingClient, event: TelemetryEvent) => {
    emitTelemetryWithPlugins({
      pluginHost: pluginHostRef.current,
      tracking: trackingClient,
      xapi: xapiRef.current,
      event,
      pluginCtx: buildPluginContext({
        courseId: courseIdRef.current,
        sessionId: sessionIdRef.current,
        attemptId: attemptIdRef.current,
      }),
      lxpackBridge: lxpackBridgeModeRef.current,
    });
  }, []);

  const track = useCallback(
    (name: TelemetryEventName, data?: unknown, opts?: { lessonId?: LessonId }) => {
      const event = tryBuildTrackEvent({
        name,
        courseId: courseIdRef.current,
        lessonId: opts?.lessonId ?? activeLessonIdRef.current,
        sessionId: sessionIdRef.current,
        attemptId: attemptIdRef.current,
        user: userRef.current,
        data,
      });
      if (!event) return;
      emitWithBridge(trackingRef.current, event);
    },
    [emitWithBridge],
  );

  useLayoutEffect(() => {
    if (!pendingCourseIdResetRef.current) return;
    pendingCourseIdResetRef.current = false;
    syncProgress();

    if (!isTrackingActive(config.tracking)) return;

    const sessionId = sessionIdRef.current;
    const cid = courseIdRef.current;
    if (
      !courseStartedEmittedToSinkRef.current &&
      !hasCourseStarted(defaultStorage, sessionId, cid)
    ) {
      markCourseStarted(defaultStorage, sessionId, cid);
      emitTelemetryWithPlugins({
        pluginHost: pluginHostRef.current,
        tracking: trackingRef.current,
        xapi: xapiRef.current,
        event: buildTrackEvent({
          name: "course_started",
          courseId: cid,
          sessionId,
          attemptId: attemptIdRef.current,
          user: userRef.current,
        }),
        pluginCtx: buildPluginContext({
          courseId: cid,
          sessionId,
          attemptId: attemptIdRef.current,
        }),
        lxpackBridge: lxpackBridgeModeRef.current,
      });
      courseStartedEmittedToSinkRef.current = true;
    }
  }, [config.courseId, config.tracking?.enabled, syncProgress]);

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
      void trackingRef.current?.flush?.();
    },
    [syncProgress, emitLessonCompleted],
  );

  const unmountTimerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    return () => {
      for (const id of unmountTimerIdsRef.current) clearTimeout(id);
      unmountTimerIdsRef.current = [];

      const client = trackingClientForUnmountRef.current;
      void xapiRef.current?.flush();
      const flushTimer = setTimeout(() => {
        client?.flush?.();
        const disposeTimer = setTimeout(() => {
          client?.dispose?.();
        }, 0);
        unmountTimerIdsRef.current.push(disposeTimer);
      }, 0);
      unmountTimerIdsRef.current.push(flushTimer);
    };
  }, []);

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
    void trackingRef.current?.flush?.();
  }, [track, syncProgress]);

  const sessionUser = config.session?.user;
  const sessionAttemptId = config.session?.attemptId;
  const sessionConfiguredId = config.session?.sessionId;

  useEffect(() => {
    if (!pluginHost) return;
    const ctx = buildPluginContext({
      courseId: courseIdRef.current,
      sessionId: sessionIdRef.current,
      attemptId: attemptIdRef.current,
    });
    pluginHost.setupAll(ctx);
    return () => {
      pluginHost.disposeAll();
    };
  }, [pluginHost, config.courseId, sessionAttemptId, sessionConfiguredId]);

  useEffect(() => {
    const nextConfigured = config.session?.sessionId;
    const prevConfigured = prevConfiguredSessionIdRef.current;
    if (nextConfigured === prevConfigured) return;
    prevConfiguredSessionIdRef.current = nextConfigured;

    const cid = courseIdRef.current;

    if (nextConfigured) {
      const fromIds = new Set<string>();
      if (prevConfigured) fromIds.add(prevConfigured);
      const tabId = getTabSessionId(defaultStorage);
      if (tabId) fromIds.add(tabId);
      for (const fromId of fromIds) {
        if (fromId !== nextConfigured) {
          migrateCourseStartedMark(defaultStorage, fromId, nextConfigured, cid);
        }
      }
      sessionIdRef.current = nextConfigured;
    } else if (prevConfigured) {
      const nextAuto = resolveSessionId(defaultStorage, undefined);
      migrateCourseStartedMark(defaultStorage, prevConfigured, nextAuto, cid);
      sessionIdRef.current = nextAuto;
    }
  }, [sessionConfiguredId, config.courseId]);

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
      plugins: pluginHost,
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
      pluginHost,
      sessionUser,
      sessionAttemptId,
      sessionConfiguredId,
    ],
  );

  return <LessonkitContext.Provider value={runtime}>{props.children}</LessonkitContext.Provider>;
}
