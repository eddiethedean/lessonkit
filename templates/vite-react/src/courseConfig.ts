import type { TelemetryEvent } from "@lessonkit/core";
import type { LessonkitConfig } from "@lessonkit/react";
import { assertProductionCourseConfig, shouldEnforceProductionGuard } from "@lessonkit/react";
import { createFetchBatchSink, createFetchTransport } from "@lessonkit/xapi";
import type { XAPIStatement } from "@lessonkit/xapi";

/**
 * Replace with your backend token proxy. Never ship static LRS passwords in the bundle.
 * Example: fetch("/api/lrs-token") and return { Authorization: `Bearer ${token}` }.
 */
function lrsAuthHeaders(): Record<string, string> {
  return {};
}

function createObservability(): NonNullable<LessonkitConfig["observability"]> {
  const report = (channel: string, detail: unknown) => {
    if (import.meta.env.DEV) {
      console.warn(`[lessonkit:${channel}]`, detail);
      return;
    }
    // Wire to your monitoring stack (Sentry, Datadog, etc.).
    /* v8 ignore next -- production-only; swap for your APM in go-live builds */
    console.error(`[lessonkit:${channel}]`, detail);
  };

  return {
    onTelemetrySinkError: (err, ctx) => report("telemetry-sink", { err, ...ctx }),
    onTelemetryBufferDrop: () => report("telemetry-buffer-cap", {}),
    onXapiQueueDepth: (depth) => {
      if (depth > 50) report("xapi-queue-depth", { depth });
    },
    onXapiQueueCap: () => report("xapi-queue-cap", {}),
    onLxpackBridgeMiss: (event) => report("lxpack-bridge-miss", { event: event.name }),
    onLxpackBridgeError: (err) => report("lxpack-bridge-error", { err }),
    onXapiTransportError: (err) => report("xapi-transport", { err }),
    onXapiMappingError: (err) => report("xapi-mapping", { err }),
    onXapiDeadLetterPersistError: (err, ctx) =>
      report("xapi-dead-letter-persist", { err, statementId: ctx.statement.id }),
    onInvalidSessionId: (ctx) => report("invalid-session-id", ctx),
  };
}

function readProxyUrls(): { xapiProxyUrl?: string; analyticsUrl?: string } {
  return {
    xapiProxyUrl: import.meta.env.VITE_XAPI_PROXY_URL as string | undefined,
    analyticsUrl: import.meta.env.VITE_ANALYTICS_URL as string | undefined,
  };
}

function devConsoleTracking(): LessonkitConfig["tracking"] {
  return {
    sink: (event: TelemetryEvent) => {
      console.log("[telemetry]", event);
    },
  };
}

function devConsoleXapi(): LessonkitConfig["xapi"] {
  return {
    enabled: true,
    transport: (statement: XAPIStatement) => {
      console.log("[xapi]", statement);
      return Promise.resolve();
    },
  };
}

function productionTracking(analyticsUrl: string | undefined): LessonkitConfig["tracking"] {
  if (!analyticsUrl) {
    /* v8 ignore next */
    throw new Error(
      "VITE_ANALYTICS_URL is required in production. Point it at your analytics ingest proxy.",
    );
  }
  const { batchSink, exitBatchSink } = createFetchBatchSink({
    url: analyticsUrl,
    headers: lrsAuthHeaders,
  });
  return {
    enabled: true,
    batchSink,
    exitBatchSink,
    batch: { enabled: true },
  };
}

function productionXapi(xapiProxyUrl: string | undefined): LessonkitConfig["xapi"] {
  if (!xapiProxyUrl) {
    /* v8 ignore next */
    throw new Error(
      "VITE_XAPI_PROXY_URL is required in production. Point it at your LRS proxy (never the raw LRS with embedded secrets).",
    );
  }
  const { transport, exitTransport, abortInFlight } = createFetchTransport({
    url: xapiProxyUrl,
    headers: lrsAuthHeaders,
  });
  return {
    enabled: true,
    transport,
    exitTransport,
    abortInFlight,
  };
}

/** Theme preset — keep in sync with lessonkit.json `course.theme.preset`. */
export const COURSE_THEME_PRESET = "default" as const;

export function createCourseConfig(): LessonkitConfig {
  const { xapiProxyUrl, analyticsUrl } = readProxyUrls();
  const useProductionTransports = import.meta.env.PROD || (xapiProxyUrl && analyticsUrl);

  const config: LessonkitConfig = {
    courseId: "my-course",
    lxpack: {
      // Set bridge: "auto" when packaging for LMS (SCORM/xAPI/cmi5). In production, allowedParentOrigins
      // is required — see https://lessonkit.readthedocs.io/en/latest/guides/react-developers/production-checklist.html
      bridge: "off",
      // allowedParentOrigins: ["https://your-lms.example"],
    },
    observability: createObservability(),
    tracking: useProductionTransports ? productionTracking(analyticsUrl) : devConsoleTracking(),
    xapi: useProductionTransports ? productionXapi(xapiProxyUrl) : devConsoleXapi(),
  };

  if (shouldEnforceProductionGuard()) {
    assertProductionCourseConfig(config);
  }
  return config;
}
