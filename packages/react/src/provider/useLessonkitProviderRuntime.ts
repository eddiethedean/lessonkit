import {
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
  TelemetryEvent,
  TelemetryEventName,
  TelemetryUser,
  PluginHost,
  TrackingClient,
  HeadlessLessonkitRuntime,
} from "@lessonkit/core";
import { createLessonkitRuntime, createTrackingClient } from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import { createInMemoryXAPIQueue } from "@lessonkit/xapi";
import { telemetryEventToXAPIStatement } from "@lessonkit/xapi";
import { buildTelemetryEvent, tryBuildTelemetryEvent } from "../runtime/emitTelemetry";
import type { LxpackBridgeMode } from "../runtime/lxpackBridge";
import { createSessionStoragePort } from "../runtime/ports";
import { createProgressController, type ProgressState } from "../runtime/progress";
import { createXapiClientFromConfig } from "../runtime/xapi";
import {
  getTabSessionId,
  hasCourseStarted,
  hasCourseStartedEmittedToTracking,
  markCourseStarted,
  markCourseStartedEmittedToTracking,
  migrateCourseStartedMark,
  resolveSessionId,
} from "../runtime/session";
import {
  buildPluginContext,
  createReactPluginHost,
  emitTelemetryWithPlugins,
} from "../runtime/plugins";
import { createTrackingClientFromConfig, disposeTrackingClient } from "../runtime/telemetry";
import type { LessonkitConfig, LessonkitRuntime } from "../context";

export type { LessonkitConfig, LessonkitRuntime };

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const defaultStorage = createSessionStoragePort();

function isTrackingActive(tracking?: LessonkitConfig["tracking"]): boolean {
  return tracking?.enabled !== false;
}

function emitCourseStarted(opts: {
  pluginHost: PluginHost | null;
  tracking: TrackingClient;
  xapi: XAPIClient | null;
  storage: ReturnType<typeof createSessionStoragePort>;
  sessionId: string;
  courseId: CourseId;
  attemptId?: string;
  user?: TelemetryUser;
  lxpackBridge: LxpackBridgeMode;
  extraSinks?: import("@lessonkit/core").TelemetryPipelineSink[];
}): boolean {
  const pluginCtx = buildPluginContext({
    courseId: opts.courseId,
    sessionId: opts.sessionId,
    attemptId: opts.attemptId,
  });
  try {
    emitTelemetryWithPlugins({
      pluginHost: opts.pluginHost,
      tracking: opts.tracking,
      xapi: opts.xapi,
      event: buildTelemetryEvent({
        name: "course_started",
        courseId: opts.courseId,
        sessionId: opts.sessionId,
        attemptId: opts.attemptId,
        user: opts.user,
      }),
      pluginCtx,
      lxpackBridge: opts.lxpackBridge,
      extraSinks: opts.extraSinks,
    });
    markCourseStarted(opts.storage, opts.sessionId, opts.courseId);
    markCourseStartedEmittedToTracking(opts.storage, opts.sessionId, opts.courseId);
    return true;
  } catch {
    /* v8 ignore next -- sink/xAPI failures leave dedupe unmarked so a later effect can retry */
    return false;
  }
}

/** Emit course_started to tracking/bridge when xAPI bootstrap already marked session storage. */
function emitCourseStartedToTrackingOnly(opts: {
  pluginHost: PluginHost | null;
  tracking: TrackingClient;
  sessionId: string;
  courseId: CourseId;
  attemptId?: string;
  user?: TelemetryUser;
  lxpackBridge: LxpackBridgeMode;
  extraSinks?: import("@lessonkit/core").TelemetryPipelineSink[];
}): boolean {
  const pluginCtx = buildPluginContext({
    courseId: opts.courseId,
    sessionId: opts.sessionId,
    attemptId: opts.attemptId,
  });
  try {
    emitTelemetryWithPlugins({
      pluginHost: opts.pluginHost,
      tracking: opts.tracking,
      xapi: null,
      event: buildTelemetryEvent({
        name: "course_started",
        courseId: opts.courseId,
        sessionId: opts.sessionId,
        attemptId: opts.attemptId,
        user: opts.user,
      }),
      pluginCtx,
      lxpackBridge: opts.lxpackBridge,
      extraSinks: opts.extraSinks,
    });
    return true;
  } catch {
    return false;
  }
}

let warnedSinkAndBatchSink = false;

function warnTrackingSinkAndBatchSinkTogether(): void {
  const g = globalThis as typeof globalThis & { process?: { NODE_ENV?: string } };
  if (typeof g.process !== "undefined" && g.process.env?.NODE_ENV === "production") return;
  if (warnedSinkAndBatchSink) return;
  warnedSinkAndBatchSink = true;
  console.warn(
    "[lessonkit] tracking.sink and tracking.batchSink are both set; flushed batches only use batchSink",
  );
}

export function useLessonkitProviderRuntime(config: LessonkitConfig): LessonkitRuntime {
  const useV2Runtime = config.runtimeVersion !== "v1";
  const extraSinksRef = useRef(config.sinks);
  extraSinksRef.current = config.sinks;

  const headlessRef = useRef<HeadlessLessonkitRuntime | null>(null);
  if (useV2Runtime && !headlessRef.current) {
    headlessRef.current = createLessonkitRuntime({
      courseId: config.courseId,
      runtimeVersion: "v2",
      session: config.session,
    });
  }

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
    if (useV2Runtime && headlessRef.current) {
      headlessRef.current.resetForCourseChange(config.courseId);
      progressRef.current = headlessRef.current.progress;
    } else {
      progressRef.current = createProgressController();
    }
    pendingCourseIdResetRef.current = true;
    courseStartedEmittedToSinkRef.current = false;
  }

  if (useV2Runtime && headlessRef.current) {
    progressRef.current = headlessRef.current.progress;
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
    const courseChanged = prevXapiCourseIdRef.current !== courseId;
    if (courseChanged) {
      if (config.xapi?.client) {
        const g = globalThis as typeof globalThis & { process?: { NODE_ENV?: string } };
        if (typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production") {
          console.warn(
            "[lessonkit] courseId changed while using config.xapi.client; flush the client between courses or use config.xapi.transport so the provider can manage the queue.",
          );
        }
        void xapiRef.current?.flush();
      }
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
            buildTelemetryEvent({
              name: "course_started",
              courseId: cid,
              sessionId,
              attemptId: attemptIdRef.current,
              user: userRef.current,
            }),
          );
          if (statement) {
            next.send(statement);
            markCourseStarted(defaultStorage, sessionId, cid);
          }
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

  const buildCurrentPluginCtx = useCallback(
    () =>
      buildPluginContext({
        courseId: courseIdRef.current,
        sessionId: sessionIdRef.current,
        attemptId: attemptIdRef.current,
      }),
    [],
  );

  useIsoLayoutEffect(() => {
    const prev = trackingRef.current;
    const baseSink = config.tracking?.sink;
    const userBatchSink = config.tracking?.batchSink;
    if (baseSink && userBatchSink) {
      warnTrackingSinkAndBatchSinkTogether();
    }
    const sink =
      pluginHostRef.current && baseSink
        ? (pluginHostRef.current.composeTrackingSink(baseSink, buildCurrentPluginCtx) ?? baseSink)
        : baseSink;
    const batchSink =
      pluginHostRef.current && userBatchSink
        ? async (events: TelemetryEvent[]) => {
            const host = pluginHostRef.current!;
            const ctx = buildCurrentPluginCtx();
            const delivered = host.deliverTelemetryBatch(events, ctx);
            const perEventForBatch: TelemetryEvent[] = [];
            const collector: (event: TelemetryEvent) => void = (event) => {
              perEventForBatch.push(event);
            };
            const composedPerEvent =
              host.composeTrackingSink(collector, buildCurrentPluginCtx) ?? collector;
            for (const event of delivered) {
              await Promise.resolve(composedPerEvent(event));
            }
            return userBatchSink(perEventForBatch);
          }
        : userBatchSink;
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
      !hasCourseStartedEmittedToTracking(defaultStorage, sessionId, cid)
    ) {
      const emitted = hasCourseStarted(defaultStorage, sessionId, cid)
        ? emitCourseStartedToTrackingOnly({
            pluginHost: pluginHostRef.current,
            tracking: next,
            sessionId,
            courseId: cid,
            attemptId: attemptIdRef.current,
            user: userRef.current,
            lxpackBridge: lxpackBridgeModeRef.current,
            extraSinks: extraSinksRef.current,
          })
        : emitCourseStarted({
            pluginHost: pluginHostRef.current,
            tracking: next,
            xapi: xapiRef.current,
            storage: defaultStorage,
            sessionId,
            courseId: cid,
            attemptId: attemptIdRef.current,
            user: userRef.current,
            lxpackBridge: lxpackBridgeModeRef.current,
            extraSinks: extraSinksRef.current,
          });
      if (emitted) {
        markCourseStartedEmittedToTracking(defaultStorage, sessionId, cid);
      }
      courseStartedEmittedToSinkRef.current = emitted;
    } else if (trackingActive) {
      courseStartedEmittedToSinkRef.current = true;
    }

    return () => {
      if (prev !== trackingRef.current) {
        void disposeTrackingClient(prev);
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
    config.courseId,
    buildCurrentPluginCtx,
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
      extraSinks: extraSinksRef.current,
    });
  }, []);

  const emitLifecycleEvent = useCallback(
    (name: TelemetryEventName, data?: unknown, lessonId?: LessonId) => {
      const event = tryBuildTelemetryEvent({
        name,
        courseId: courseIdRef.current,
        lessonId: lessonId ?? activeLessonIdRef.current,
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

  const track = useCallback(
    (name: TelemetryEventName, data?: unknown, opts?: { lessonId?: LessonId }) => {
      const event = tryBuildTelemetryEvent({
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

    void (async () => {
      try {
        await trackingRef.current?.flush?.();
        /* v8 ignore next 3 -- flush errors during course switch must not block lifecycle */
      } catch {
        // ignore flush errors during course switch
      }

      /* v8 ignore start -- backup emit when tracking effect did not mark course_started */
      if (
        !courseStartedEmittedToSinkRef.current &&
        !hasCourseStarted(defaultStorage, sessionId, cid)
      ) {
        const emitted = emitCourseStarted({
          pluginHost: pluginHostRef.current,
          tracking: trackingRef.current,
          xapi: xapiRef.current,
          storage: defaultStorage,
          sessionId,
          courseId: cid,
          attemptId: attemptIdRef.current,
          user: userRef.current,
          lxpackBridge: lxpackBridgeModeRef.current,
          extraSinks: extraSinksRef.current,
        });
        courseStartedEmittedToSinkRef.current = emitted;
      }
      /* v8 ignore stop */
    })();
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
      if (useV2Runtime && headlessRef.current) {
        headlessRef.current.completeLesson(lessonId, emitLifecycleEvent);
        syncProgress();
        void Promise.resolve(trackingRef.current?.flush?.());
        return;
      }
      const result = progressRef.current.completeLesson(lessonId, Date.now());
      if (!result.didComplete) return;
      syncProgress();
      emitLessonCompleted(lessonId, result.durationMs);
      void Promise.resolve(trackingRef.current?.flush?.());
    },
    [syncProgress, emitLessonCompleted, useV2Runtime, emitLifecycleEvent],
  );

  useEffect(() => {
    return () => {
      const client = trackingClientForUnmountRef.current;
      const xapi = xapiRef.current;
      void (async () => {
        try {
          await xapi?.flush();
        } catch {
          // ignore
        }
        try {
          await client?.flush?.();
        } catch {
          // ignore
        }
        try {
          await client?.dispose?.();
        } catch {
          // ignore
        }
      })();
    };
  }, []);

  const setActiveLesson = useCallback(
    (lessonId: LessonId) => {
      if (useV2Runtime && headlessRef.current) {
        headlessRef.current.setActiveLesson(lessonId, emitLifecycleEvent);
        syncProgress();
        void Promise.resolve(trackingRef.current?.flush?.());
        return;
      }
      const current = progressRef.current.getState();
      if (current.activeLessonId === lessonId) return;

      const previous = current.activeLessonId;
      if (previous && previous !== lessonId) {
        const completed = progressRef.current.completeLesson(previous, Date.now());
        if (completed.didComplete) {
          emitLessonCompleted(previous, completed.durationMs);
          void Promise.resolve(trackingRef.current?.flush?.());
        }
      }

      progressRef.current.setActiveLesson(lessonId, Date.now());
      syncProgress();
      track("lesson_started", { lessonId }, { lessonId });
    },
    [track, syncProgress, emitLessonCompleted, useV2Runtime, emitLifecycleEvent],
  );

  const completeCourse = useCallback(() => {
    if (useV2Runtime && headlessRef.current) {
      headlessRef.current.completeCourse(emitLifecycleEvent);
      syncProgress();
      void trackingRef.current?.flush?.();
      return;
    }
    const current = progressRef.current.getState();
    if (current.activeLessonId) {
      const lessonResult = progressRef.current.completeLesson(current.activeLessonId, Date.now());
      if (lessonResult.didComplete) {
        emitLessonCompleted(current.activeLessonId, lessonResult.durationMs);
      }
    }

    const result = progressRef.current.completeCourse();
    if (!result.didComplete) return;
    syncProgress();
    track("course_completed");
    void trackingRef.current?.flush?.();
  }, [track, syncProgress, emitLessonCompleted, useV2Runtime, emitLifecycleEvent]);

  const sessionUser = config.session?.user;
  const sessionUserKey = useMemo(
    () => (sessionUser ? JSON.stringify(sessionUser) : ""),
    [sessionUser],
  );
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
  }, [pluginHost, config.courseId, sessionAttemptId, sessionConfiguredId, sessionUserKey]);

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

  return runtime;
}
