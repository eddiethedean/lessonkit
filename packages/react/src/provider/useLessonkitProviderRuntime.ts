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
  TelemetryDataFor,
  TelemetryEvent,
  TelemetryEventName,
  TelemetryUser,
  TrackingClient,
  HeadlessLessonkitRuntime,
  TelemetryEmitFn,
} from "@lessonkit/core";
import { createLessonkitRuntime, createTrackingClient, assertValidId } from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";

import { createXapiQueueFromObservability, wrapTrackingSink } from "../runtime/observability";
import { telemetryEventToXAPIStatement } from "@lessonkit/xapi";
import { tryBuildTelemetryEvent } from "../runtime/emitTelemetry";
import type { LxpackBridgeMode } from "../runtime/lxpackBridge";
import { createSessionStoragePort, resetStoragePortForTests } from "../runtime/ports";
import { createProgressController, type ProgressState } from "../runtime/progress";
import { createXapiClientFromConfig } from "../runtime/xapi";
import {
  getTabSessionId,
  hasCourseStarted,
  hasCourseStartedEmittedToTracking,
  hasCourseStartedPipelineDelivered,
  markCourseStarted,
  migrateCourseStartedMark,
  resolveSessionId,
} from "../runtime/session";
import {
  assertTrackingSinkConfig,
  buildCourseStartedEvent,
  emitPendingCourseStarted,
  isCourseStartedSinkSettled,
  isTrackingActive,
  resetCourseStartedTrackingFlightForTests,
} from "./courseStarted";
import {
  buildPluginContext,
  createReactPluginHost,
  emitTelemetryWithPlugins,
} from "../runtime/plugins";
import { createTrackingClientFromConfig, disposeTrackingClient } from "../runtime/telemetry";
import type { LessonkitConfig, LessonkitRuntime } from "../context";

export type { LessonkitConfig, LessonkitRuntime };

const useIsoLayoutEffect =
  /* v8 ignore next -- SSR uses useEffect when window is unavailable */
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const defaultStorage = createSessionStoragePort();

/** @internal Reset provider session dedupe between tests. */
export function resetLessonkitProviderStorageForTests(): void {
  resetStoragePortForTests(defaultStorage);
}

export { resetCourseStartedTrackingFlightForTests };

export function useLessonkitProviderRuntime(config: LessonkitConfig): LessonkitRuntime {
  const normalizedCourseId = useMemo(
    () => assertValidId(config.courseId, "courseId"),
    [config.courseId],
  );
  const normalizedConfig = useMemo(
    () => ({ ...config, courseId: normalizedCourseId }),
    [config, normalizedCourseId],
  );

  const useV2Runtime = normalizedConfig.runtimeVersion !== "v1";

  useEffect(() => {
    if (useV2Runtime) return;
    const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
    if (typeof g.process !== "undefined" && g.process.env?.NODE_ENV === "production") return;
    console.warn(
      '[lessonkit] LessonkitProvider runtimeVersion "v1" is deprecated; omit or use "v2" (default). v1 will be removed in LessonKit 2.0.',
    );
  }, [useV2Runtime]);

  const extraSinksRef = useRef(normalizedConfig.sinks);
  extraSinksRef.current = normalizedConfig.sinks;

  const headlessRef = useRef<HeadlessLessonkitRuntime | null>(null);

  const sessionIdRef = useRef<string>(resolveSessionId(defaultStorage, normalizedConfig.session?.sessionId));
  const prevConfiguredSessionIdRef = useRef<string | undefined>(normalizedConfig.session?.sessionId);
  if (normalizedConfig.session?.sessionId) {
    sessionIdRef.current = normalizedConfig.session.sessionId;
  } else if (prevConfiguredSessionIdRef.current) {
    sessionIdRef.current = resolveSessionId(defaultStorage, undefined);
  }

  const attemptIdRef = useRef<string | undefined>(normalizedConfig.session?.attemptId);
  const userRef = useRef<TelemetryUser | undefined>(normalizedConfig.session?.user);
  attemptIdRef.current = normalizedConfig.session?.attemptId;
  userRef.current = normalizedConfig.session?.user;

  const courseIdRef = useRef<CourseId>(normalizedCourseId);
  courseIdRef.current = normalizedCourseId;

  const lxpackBridgeModeRef = useRef<LxpackBridgeMode>(normalizedConfig.lxpack?.bridge ?? "auto");
  lxpackBridgeModeRef.current = normalizedConfig.lxpack?.bridge ?? "auto";

  const observabilityRef = useRef(normalizedConfig.observability);
  observabilityRef.current = normalizedConfig.observability;

  const onLxpackBridgeMiss = useCallback((event: TelemetryEvent) => {
    observabilityRef.current?.onLxpackBridgeMiss?.(event);
  }, []);

  const pluginsFingerprint =
    normalizedConfig.plugins?.map((p) => `${p.id}\0${p.version}`).join("|") ?? "";
  const pluginHost = useMemo(
    () => createReactPluginHost(normalizedConfig.plugins),
    [pluginsFingerprint],
  );
  const pluginHostRef = useRef(pluginHost);
  pluginHostRef.current = pluginHost;

  const progressRef = useRef(createProgressController());
  const courseStartedEmittedToSinkRef = useRef(false);
  const courseStartedEmitGenerationRef = useRef(0);
  const prevCourseIdForProgressRef = useRef(normalizedCourseId);
  const pendingCourseIdResetRef = useRef(false);
  const prevUseV2RuntimeRef = useRef(useV2Runtime);
  const xapiCourseStartedSentOnClientRef = useRef(false);

  if (prevUseV2RuntimeRef.current !== useV2Runtime) {
    prevUseV2RuntimeRef.current = useV2Runtime;
    if (useV2Runtime) {
      headlessRef.current = createLessonkitRuntime({
        courseId: normalizedCourseId,
        runtimeVersion: "v2",
        session: normalizedConfig.session,
        plugins: pluginHostRef.current ?? normalizedConfig.plugins,
      });
      progressRef.current = headlessRef.current.progress;
    } else {
      headlessRef.current = null;
      progressRef.current = createProgressController();
    }
    pendingCourseIdResetRef.current = true;
    courseStartedEmittedToSinkRef.current = false;
    courseStartedEmitGenerationRef.current += 1;
  } else if (useV2Runtime && !headlessRef.current) {
    headlessRef.current = createLessonkitRuntime({
      courseId: normalizedCourseId,
      runtimeVersion: "v2",
      session: normalizedConfig.session,
      plugins: pluginHostRef.current ?? normalizedConfig.plugins,
    });
  }

  if (prevCourseIdForProgressRef.current !== normalizedCourseId) {
    prevCourseIdForProgressRef.current = normalizedCourseId;
    if (useV2Runtime && headlessRef.current) {
      headlessRef.current.resetForCourseChange(normalizedCourseId);
      progressRef.current = headlessRef.current.progress;
    } else {
      progressRef.current = createProgressController();
    }
    pendingCourseIdResetRef.current = true;
    courseStartedEmittedToSinkRef.current = false;
    courseStartedEmitGenerationRef.current += 1;
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

  const xapiQueueRef = useRef(createXapiQueueFromObservability(normalizedConfig.observability));
  const xapiRef = useRef<XAPIClient | null>(null);
  const [xapi, setXapi] = useState<XAPIClient | null>(null);
  const prevXapiCourseIdRef = useRef(normalizedCourseId);

  const xapiEnabled = normalizedConfig.xapi?.enabled;
  const xapiClient = normalizedConfig.xapi?.client;
  const xapiTransport = normalizedConfig.xapi?.transport;
  const courseId = normalizedCourseId;
  const trackingEnabled = normalizedConfig.tracking?.enabled;

  useIsoLayoutEffect(() => {
    const courseChanged = prevXapiCourseIdRef.current !== courseId;
    if (courseChanged) {
      if (normalizedConfig.xapi?.client) {
        const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
        /* v8 ignore start -- production relies on host-managed client flushing */
        if (typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production") {
          console.warn(
            "[lessonkit] courseId changed while using config.xapi.client; flush the client between courses or use config.xapi.transport so the provider can manage the queue.",
          );
        }
        /* v8 ignore stop */
        void xapiRef.current?.flush();
      }
      xapiQueueRef.current = createXapiQueueFromObservability(observabilityRef.current);
      prevXapiCourseIdRef.current = courseId;
      xapiCourseStartedSentOnClientRef.current = false;
    }

    const prev = xapiRef.current;
    const next = createXapiClientFromConfig(normalizedConfig, xapiQueueRef.current);
    xapiRef.current = next;
    setXapi(next);

    if (next) {
      const sessionId = sessionIdRef.current;
      const cid = courseIdRef.current;
      const trackingActive = isTrackingActive(normalizedConfig.tracking);
      const alreadyStarted = hasCourseStarted(defaultStorage, sessionId, cid);
      const clientChanged = !prev || prev !== next;
      // When tracking is on, course_started (and xAPI) normally flow through emitTelemetry on first start.
      const skipBootstrap = trackingActive && !alreadyStarted;
      const needsBootstrap =
        !skipBootstrap &&
        !xapiCourseStartedSentOnClientRef.current &&
        (!alreadyStarted || clientChanged);
      if (needsBootstrap) {
        try {
          const event = buildCourseStartedEvent({
            pluginHost: pluginHostRef.current,
            courseId: cid,
            sessionId,
            attemptId: attemptIdRef.current,
            user: userRef.current,
            lxpackBridge: lxpackBridgeModeRef.current,
          });
          if (event === null) {
            // Plugin filtered course_started; do not bootstrap xAPI or session marks.
          } else {
            const statement = telemetryEventToXAPIStatement(event);
            if (statement) {
              next.send(statement);
              if (!alreadyStarted) {
                markCourseStarted(defaultStorage, sessionId, cid);
              }
              xapiCourseStartedSentOnClientRef.current = true;
            }
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
      /* v8 ignore start -- xAPI layout cleanup cancels in-flight flush before it settles */
      if (cancelled) return;
      /* v8 ignore stop */
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

  const trackingSink = normalizedConfig.tracking?.sink;
  const trackingBatchSink = normalizedConfig.tracking?.batchSink;
  const batchEnabled = normalizedConfig.tracking?.batch?.enabled;
  const batchFlushIntervalMs = normalizedConfig.tracking?.batch?.flushIntervalMs;
  const batchMaxBatchSize = normalizedConfig.tracking?.batch?.maxBatchSize;

  const buildCurrentPluginCtx = useCallback(
    () =>
      buildPluginContext({
        courseId: courseIdRef.current,
        sessionId: sessionIdRef.current,
        attemptId: attemptIdRef.current,
        user: userRef.current,
      }),
    [],
  );

  useIsoLayoutEffect(() => {
    const prev = trackingRef.current;
    const baseSink = wrapTrackingSink(normalizedConfig.tracking?.sink, observabilityRef.current);
    const userBatchSink = normalizedConfig.tracking?.batchSink;
    assertTrackingSinkConfig(normalizedConfig.tracking);
    const sink =
      pluginHostRef.current && baseSink
        ? /* v8 ignore next -- composeTrackingSink may return null; fall back to base sink */
          (pluginHostRef.current.composeTrackingSink(baseSink, buildCurrentPluginCtx) ?? baseSink)
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
            /* v8 ignore start -- composeTrackingSink may return null; fall back to collector */
            const composedPerEvent =
              host.composeTrackingSink(collector, buildCurrentPluginCtx) ?? collector;
            /* v8 ignore stop */
            for (const event of delivered) {
              await Promise.resolve(composedPerEvent(event));
            }
            return userBatchSink(perEventForBatch);
          }
        : userBatchSink;
    const next = createTrackingClientFromConfig({
      tracking: { ...normalizedConfig.tracking, sink, batchSink },
    });
    trackingRef.current = next;
    trackingClientForUnmountRef.current = next;
    setTracking(next);

    const sessionId = sessionIdRef.current;
    const cid = courseIdRef.current;
    const trackingActive = isTrackingActive(normalizedConfig.tracking);

    const courseStartedFullySettled =
      hasCourseStartedEmittedToTracking(defaultStorage, sessionId, cid) &&
      hasCourseStarted(defaultStorage, sessionId, cid) &&
      hasCourseStartedPipelineDelivered(defaultStorage, sessionId, cid);

    if (!trackingActive) {
      courseStartedEmittedToSinkRef.current = false;
    } else if (courseStartedFullySettled) {
      courseStartedEmittedToSinkRef.current = true;
    } else if (!courseStartedEmittedToSinkRef.current) {
      const generation = ++courseStartedEmitGenerationRef.current;
      const shouldCommit = () => generation === courseStartedEmitGenerationRef.current;
      void (async () => {
        /* v8 ignore start -- superseded course_started generation exits before emit */
        if (generation !== courseStartedEmitGenerationRef.current) return;
        /* v8 ignore stop */
        const result = await emitPendingCourseStarted({
          pluginHost: pluginHostRef.current,
          tracking: next,
          xapi: xapiRef.current,
          storage: defaultStorage,
          sessionId,
          courseId: cid,
          attemptId: attemptIdRef.current,
          user: userRef.current,
          lxpackBridge: lxpackBridgeModeRef.current,
          onLxpackBridgeMiss,
          extraSinks: extraSinksRef.current,
          skipXapi: xapiCourseStartedSentOnClientRef.current,
          onXapiStatementSent: () => {
            xapiCourseStartedSentOnClientRef.current = true;
          },
          shouldCommit,
        });
        if (generation !== courseStartedEmitGenerationRef.current) return;
        courseStartedEmittedToSinkRef.current = isCourseStartedSinkSettled(result);
      })();
    }

    return () => {
      courseStartedEmitGenerationRef.current += 1;
      /* v8 ignore start -- tracking client unchanged between layout passes */
      if (prev !== trackingRef.current) {
        void disposeTrackingClient(prev);
      }
      /* v8 ignore stop */
    };
  }, [
    trackingEnabled,
    trackingSink,
    trackingBatchSink,
    batchEnabled,
    batchFlushIntervalMs,
    batchMaxBatchSize,
    normalizedConfig.plugins,
    normalizedCourseId,
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
        user: userRef.current,
      }),
      lxpackBridge: lxpackBridgeModeRef.current,
      onLxpackBridgeMiss,
      extraSinks: extraSinksRef.current,
    });
  }, [onLxpackBridgeMiss]);

  const emitLifecycleEvent: TelemetryEmitFn = useCallback(
    (name, data, lessonId) => {
      const event = tryBuildTelemetryEvent({
        name,
        courseId: courseIdRef.current,
        lessonId: lessonId ?? activeLessonIdRef.current,
        sessionId: sessionIdRef.current,
        attemptId: attemptIdRef.current,
        user: userRef.current,
        data,
      } as Parameters<typeof tryBuildTelemetryEvent>[0]);
      /* v8 ignore start -- invalid lifecycle payloads are dropped before emit */
      if (!event) return;
      /* v8 ignore stop */
      emitWithBridge(trackingRef.current, event);
    },
    [emitWithBridge],
  );

  const track = useCallback(
    <N extends TelemetryEventName>(
      name: N,
      data?: TelemetryDataFor<N>,
      opts?: { lessonId?: LessonId },
    ) => {
      const event = tryBuildTelemetryEvent({
        name,
        courseId: courseIdRef.current,
        lessonId: opts?.lessonId ?? activeLessonIdRef.current,
        sessionId: sessionIdRef.current,
        attemptId: attemptIdRef.current,
        user: userRef.current,
        data,
      } as Parameters<typeof tryBuildTelemetryEvent>[0]);
      /* v8 ignore start -- invalid ad-hoc payloads are dropped before emit */
      if (!event) return;
      /* v8 ignore stop */
      emitWithBridge(trackingRef.current, event);
    },
    [emitWithBridge],
  );

  useLayoutEffect(() => {
    if (!pendingCourseIdResetRef.current) return;
    pendingCourseIdResetRef.current = false;
    syncProgress();

    if (!isTrackingActive(normalizedConfig.tracking)) return;

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
      if (!courseStartedEmittedToSinkRef.current) {
        const result = await emitPendingCourseStarted({
          pluginHost: pluginHostRef.current,
          tracking: trackingRef.current,
          xapi: xapiRef.current,
          storage: defaultStorage,
          sessionId,
          courseId: cid,
          attemptId: attemptIdRef.current,
          user: userRef.current,
          lxpackBridge: lxpackBridgeModeRef.current,
          onLxpackBridgeMiss,
          extraSinks: extraSinksRef.current,
        });
        courseStartedEmittedToSinkRef.current = isCourseStartedSinkSettled(result);
      }
      /* v8 ignore stop */
    })();
  }, [normalizedCourseId, normalizedConfig.tracking?.enabled, syncProgress, onLxpackBridgeMiss]);

  const emitLessonCompleted = useCallback(
    (lessonId: LessonId, durationMs?: number) => {
      track("lesson_completed", { lessonId, durationMs }, { lessonId });
      /* v8 ignore start -- lesson_time_on_task only emits when duration is known */
      if (durationMs !== undefined) {
        track("lesson_time_on_task", { lessonId, durationMs }, { lessonId });
      }
      /* v8 ignore stop */
    },
    [track],
  );

  const completeLesson = useCallback(
    (lessonId: LessonId, opts?: { courseId?: CourseId }) => {
      if (opts?.courseId !== undefined && opts.courseId !== courseIdRef.current) {
        return;
      }
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

  useEffect(() => {
    if (typeof document === "undefined") return;
    const flushOnExit = () => {
      void xapiRef.current?.flush();
      void trackingRef.current?.flush?.();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushOnExit();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flushOnExit);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flushOnExit);
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
      if (current.completedLessonIds.has(lessonId)) {
        progressRef.current.setActiveLesson(lessonId, Date.now());
        syncProgress();
        return;
      }

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

  const sessionUser = normalizedConfig.session?.user;
  const sessionUserKey = useMemo(
    () => (sessionUser ? JSON.stringify(sessionUser) : ""),
    [sessionUser],
  );
  const sessionAttemptId = normalizedConfig.session?.attemptId;
  const sessionConfiguredId = normalizedConfig.session?.sessionId;

  useEffect(() => {
    if (useV2Runtime && headlessRef.current) {
      headlessRef.current.updateConfig({
        courseId: normalizedCourseId,
        session: normalizedConfig.session,
      });
    }
  }, [
    useV2Runtime,
    normalizedCourseId,
    sessionAttemptId,
    sessionConfiguredId,
    sessionUserKey,
    normalizedConfig.session,
  ]);

  useEffect(() => {
    if (!useV2Runtime || !headlessRef.current) return;
    headlessRef.current.updateConfig({
      plugins: pluginHostRef.current ?? normalizedConfig.plugins,
    });
  }, [useV2Runtime, pluginHost]);

  useEffect(() => {
    const host = useV2Runtime ? headlessRef.current?.pluginHost ?? null : pluginHost;
    if (!host) return;
    const ctx = buildPluginContext({
      courseId: courseIdRef.current,
      sessionId: sessionIdRef.current,
      attemptId: attemptIdRef.current,
      user: userRef.current,
    });
    host.setupAll(ctx);
    return () => {
      host.disposeAll();
    };
  }, [pluginHost, useV2Runtime, normalizedCourseId, sessionAttemptId, sessionConfiguredId, sessionUserKey]);

  useEffect(() => {
    const nextConfigured = normalizedConfig.session?.sessionId;
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
        /* v8 ignore start -- session migration skips when ids already match */
        if (fromId !== nextConfigured) {
          migrateCourseStartedMark(defaultStorage, fromId, nextConfigured, cid);
        }
        /* v8 ignore stop */
      }
      sessionIdRef.current = nextConfigured;
    /* v8 ignore start -- initial mount has no configured session id to migrate from */
    } else if (prevConfigured) {
      const nextAuto = resolveSessionId(defaultStorage, undefined);
      migrateCourseStartedMark(defaultStorage, prevConfigured, nextAuto, cid);
      sessionIdRef.current = nextAuto;
    }
    /* v8 ignore stop */
  }, [sessionConfiguredId, normalizedCourseId]);

  const runtime = useMemo<LessonkitRuntime>(
    () => ({
      config: normalizedConfig,
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
      normalizedConfig,
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
