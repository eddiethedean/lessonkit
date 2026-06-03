import { useCallback, useLayoutEffect, useEffect, useRef, useState } from "react";
import type React from "react";
import type { CourseId, PluginHost, TelemetryEvent, TelemetryUser, TrackingClient } from "@lessonkit/core";
import { createTrackingClient } from "@lessonkit/core";
import type { LessonkitConfig } from "../context";
import type { LxpackBridgeMode } from "../runtime/lxpackBridge";
import { createSessionStoragePort } from "../runtime/ports";
import {
  hasCourseStarted,
  hasCourseStartedEmittedToTracking,
  hasCourseStartedPipelineDelivered,
} from "../runtime/session";
import { buildPluginContext } from "../runtime/plugins";
import { createTrackingClientFromConfig, disposeTrackingClient } from "../runtime/telemetry";
import {
  assertTrackingSinkConfig,
  emitPendingCourseStarted,
  isCourseStartedSinkSettled,
  isTrackingActive,
} from "./courseStarted";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type TrackingLifecycleOpts = {
  normalizedConfig: LessonkitConfig;
  normalizedCourseId: CourseId;
  defaultStorage?: ReturnType<typeof createSessionStoragePort>;
  sessionIdRef: React.MutableRefObject<string>;
  courseIdRef: React.MutableRefObject<CourseId>;
  attemptIdRef: React.MutableRefObject<string | undefined>;
  userRef: React.MutableRefObject<TelemetryUser | undefined>;
  pluginHostRef: React.MutableRefObject<PluginHost | null>;
  lxpackBridgeModeRef: React.MutableRefObject<LxpackBridgeMode>;
  extraSinksRef: React.MutableRefObject<import("@lessonkit/core").TelemetryPipelineSink[] | undefined>;
  xapiRef: React.MutableRefObject<import("@lessonkit/xapi").XAPIClient | null>;
  xapiCourseStartedSentOnClientRef: React.MutableRefObject<boolean>;
  courseStartedEmittedToSinkRef: React.MutableRefObject<boolean>;
  courseStartedEmitGenerationRef: React.MutableRefObject<number>;
};

export function useTrackingClientLifecycle(opts: TrackingLifecycleOpts) {
  const storage = opts.defaultStorage ?? createSessionStoragePort();
  const trackingRef = useRef<TrackingClient>(createTrackingClient());
  const trackingClientForUnmountRef = useRef<TrackingClient>(trackingRef.current);
  const [tracking, setTracking] = useState<TrackingClient>(() => trackingRef.current);

  const buildCurrentPluginCtx = useCallback(
    () =>
      buildPluginContext({
        courseId: opts.courseIdRef.current,
        sessionId: opts.sessionIdRef.current,
        attemptId: opts.attemptIdRef.current,
        user: opts.userRef.current,
      }),
    [opts.attemptIdRef, opts.courseIdRef, opts.sessionIdRef, opts.userRef],
  );

  const trackingEnabled = opts.normalizedConfig.tracking?.enabled;
  const trackingSink = opts.normalizedConfig.tracking?.sink;
  const trackingBatchSink = opts.normalizedConfig.tracking?.batchSink;
  const batchEnabled = opts.normalizedConfig.tracking?.batch?.enabled;
  const batchFlushIntervalMs = opts.normalizedConfig.tracking?.batch?.flushIntervalMs;
  const batchMaxBatchSize = opts.normalizedConfig.tracking?.batch?.maxBatchSize;

  useIsoLayoutEffect(() => {
    const prev = trackingRef.current;
    const baseSink = opts.normalizedConfig.tracking?.sink;
    const userBatchSink = opts.normalizedConfig.tracking?.batchSink;
    assertTrackingSinkConfig(opts.normalizedConfig.tracking);
    const sink =
      opts.pluginHostRef.current && baseSink
        ? (opts.pluginHostRef.current.composeTrackingSink(baseSink, buildCurrentPluginCtx) ?? baseSink)
        : baseSink;
    const batchSink =
      opts.pluginHostRef.current && userBatchSink
        ? async (events: TelemetryEvent[]) => {
            const host = opts.pluginHostRef.current!;
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
      tracking: { ...opts.normalizedConfig.tracking, sink, batchSink },
    });
    trackingRef.current = next;
    trackingClientForUnmountRef.current = next;
    setTracking(next);

    const sessionId = opts.sessionIdRef.current;
    const cid = opts.courseIdRef.current;
    const trackingActive = isTrackingActive(opts.normalizedConfig.tracking);
    const courseStartedFullySettled =
      hasCourseStartedEmittedToTracking(storage, sessionId, cid) &&
      hasCourseStarted(storage, sessionId, cid) &&
      hasCourseStartedPipelineDelivered(storage, sessionId, cid);

    if (!trackingActive) {
      opts.courseStartedEmittedToSinkRef.current = false;
    } else if (courseStartedFullySettled) {
      opts.courseStartedEmittedToSinkRef.current = true;
    } else if (!opts.courseStartedEmittedToSinkRef.current) {
      const generation = ++opts.courseStartedEmitGenerationRef.current;
      const shouldCommit = () => generation === opts.courseStartedEmitGenerationRef.current;
      void (async () => {
        if (generation !== opts.courseStartedEmitGenerationRef.current) return;
        const result = await emitPendingCourseStarted({
          pluginHost: opts.pluginHostRef.current,
          tracking: next,
          xapi: opts.xapiRef.current,
          storage,
          sessionId,
          courseId: cid,
          attemptId: opts.attemptIdRef.current,
          user: opts.userRef.current,
          lxpackBridge: opts.lxpackBridgeModeRef.current,
          extraSinks: opts.extraSinksRef.current,
          skipXapi: opts.xapiCourseStartedSentOnClientRef.current,
          onXapiStatementSent: () => {
            opts.xapiCourseStartedSentOnClientRef.current = true;
          },
          shouldCommit,
        });
        if (generation !== opts.courseStartedEmitGenerationRef.current) return;
        opts.courseStartedEmittedToSinkRef.current = isCourseStartedSinkSettled(result);
      })();
    }

    return () => {
      opts.courseStartedEmitGenerationRef.current += 1;
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
    opts.normalizedConfig.plugins,
    opts.normalizedCourseId,
    buildCurrentPluginCtx,
    opts,
  ]);

  return { tracking, trackingRef, trackingClientForUnmountRef };
}
