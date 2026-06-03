import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type React from "react";
import type { CourseId, PluginHost, TelemetryUser } from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import { createInMemoryXAPIQueue } from "@lessonkit/xapi";
import { telemetryEventToXAPIStatement } from "@lessonkit/xapi";
import type { LessonkitConfig } from "../context";
import type { LxpackBridgeMode } from "../runtime/lxpackBridge";
import { createSessionStoragePort } from "../runtime/ports";
import { hasCourseStarted, markCourseStarted } from "../runtime/session";
import { createXapiClientFromConfig } from "../runtime/xapi";
import { buildCourseStartedEvent, isTrackingActive } from "./courseStarted";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type XapiLifecycleOpts = {
  normalizedConfig: LessonkitConfig;
  courseId: CourseId;
  defaultStorage?: ReturnType<typeof createSessionStoragePort>;
  sessionIdRef: React.MutableRefObject<string>;
  courseIdRef: React.MutableRefObject<CourseId>;
  attemptIdRef: React.MutableRefObject<string | undefined>;
  userRef: React.MutableRefObject<TelemetryUser | undefined>;
  pluginHostRef: React.MutableRefObject<PluginHost | null>;
  lxpackBridgeModeRef: React.MutableRefObject<LxpackBridgeMode>;
  xapiCourseStartedSentOnClientRef: React.MutableRefObject<boolean>;
};

export function useXapiClientLifecycle(opts: XapiLifecycleOpts) {
  const storage = opts.defaultStorage ?? createSessionStoragePort();
  const xapiQueueRef = useRef(createInMemoryXAPIQueue());
  const xapiRef = useRef<XAPIClient | null>(null);
  const [xapi, setXapi] = useState<XAPIClient | null>(null);
  const prevXapiCourseIdRef = useRef(opts.courseId);

  const xapiEnabled = opts.normalizedConfig.xapi?.enabled;
  const xapiClient = opts.normalizedConfig.xapi?.client;
  const xapiTransport = opts.normalizedConfig.xapi?.transport;
  const trackingEnabled = opts.normalizedConfig.tracking?.enabled;

  useIsoLayoutEffect(() => {
    const courseChanged = prevXapiCourseIdRef.current !== opts.courseId;
    if (courseChanged) {
      if (opts.normalizedConfig.xapi?.client) {
        const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
        if (typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production") {
          console.warn(
            "[lessonkit] courseId changed while using config.xapi.client; flush the client between courses or use config.xapi.transport so the provider can manage the queue.",
          );
        }
        void xapiRef.current?.flush();
      }
      xapiQueueRef.current = createInMemoryXAPIQueue();
      prevXapiCourseIdRef.current = opts.courseId;
      opts.xapiCourseStartedSentOnClientRef.current = false;
    }

    const prev = xapiRef.current;
    const next = createXapiClientFromConfig(opts.normalizedConfig, xapiQueueRef.current);
    xapiRef.current = next;
    setXapi(next);

    if (next) {
      const sessionId = opts.sessionIdRef.current;
      const cid = opts.courseIdRef.current;
      const trackingActive = isTrackingActive(opts.normalizedConfig.tracking);
      const alreadyStarted = hasCourseStarted(storage, sessionId, cid);
      const clientChanged = !prev || prev !== next;
      const skipBootstrap = trackingActive && !alreadyStarted;
      const needsBootstrap =
        !skipBootstrap &&
        !opts.xapiCourseStartedSentOnClientRef.current &&
        (!alreadyStarted || clientChanged);
      if (needsBootstrap) {
        try {
          const event = buildCourseStartedEvent({
            pluginHost: opts.pluginHostRef.current,
            courseId: cid,
            sessionId,
            attemptId: opts.attemptIdRef.current,
            user: opts.userRef.current,
            lxpackBridge: opts.lxpackBridgeModeRef.current,
          });
          if (event !== null) {
            const statement = telemetryEventToXAPIStatement(event);
            if (statement) {
              next.send(statement);
              if (!alreadyStarted) {
                markCourseStarted(storage, sessionId, cid);
              }
              opts.xapiCourseStartedSentOnClientRef.current = true;
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
          // ignore
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
  }, [xapiEnabled, xapiClient, xapiTransport, opts.courseId, trackingEnabled, opts.normalizedConfig, opts, storage]);

  return { xapi, xapiRef, xapiQueueRef };
}
