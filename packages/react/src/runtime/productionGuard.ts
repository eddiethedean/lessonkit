import type { LessonkitConfig } from "../context";

function isProductionEnvironment(): boolean {
  try {
    if ((import.meta as { env?: { PROD?: boolean } }).env?.PROD === true) return true;
  } catch {
    // no import.meta
  }
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV === "production";
}

function looksLikeConsoleSink(fn: unknown): boolean {
  if (typeof fn !== "function") return false;
  const src = Function.prototype.toString.call(fn);
  return /console\.(log|debug|info)\s*\(/.test(src);
}

function trackingUsesConsole(config: Pick<LessonkitConfig, "tracking">): boolean {
  const tracking = config.tracking;
  if (!tracking || tracking.enabled === false) return false;
  if (tracking.batchSink && looksLikeConsoleSink(tracking.batchSink)) return true;
  if (tracking.sink && looksLikeConsoleSink(tracking.sink)) return true;
  return false;
}

function xapiUsesConsole(config: Pick<LessonkitConfig, "xapi">): boolean {
  const xapi = config.xapi;
  if (!xapi || xapi.enabled === false || xapi.client) return false;
  return typeof xapi.transport === "function" && looksLikeConsoleSink(xapi.transport);
}

function observabilityIncomplete(
  observability: LessonkitConfig["observability"] | undefined,
  opts: { trackingEnabled: boolean; xapiEnabled: boolean },
): boolean {
  if (!opts.trackingEnabled && !opts.xapiEnabled) return false;
  const hooks = [
    observability?.onTelemetrySinkError,
    observability?.onTelemetryBufferDrop,
    observability?.onXapiQueueDepth,
    observability?.onXapiQueueCap,
    observability?.onLxpackBridgeMiss,
  ];
  return !hooks.some(Boolean);
}

/**
 * Throws in production when course config still uses dev-only console sinks or
 * omits observability hooks while telemetry/xAPI are enabled.
 */
export function assertProductionCourseConfig(
  config: Pick<LessonkitConfig, "tracking" | "xapi" | "observability" | "lxpack">,
): void {
  if (!isProductionEnvironment()) return;

  const trackingEnabled = config.tracking?.enabled !== false && Boolean(config.tracking?.sink || config.tracking?.batchSink);
  const xapiEnabled =
    config.xapi?.enabled === true ||
    (config.xapi?.enabled !== false && typeof config.xapi?.transport === "function");

  if (trackingUsesConsole(config)) {
    throw new Error(
      "[lessonkit] Production build uses console telemetry sinks. Wire createFetchBatchSink or a real sink. See production checklist.",
    );
  }
  if (xapiUsesConsole(config)) {
    throw new Error(
      "[lessonkit] Production build uses console xAPI transport. Wire createFetchTransport to your LRS proxy. See production checklist.",
    );
  }
  if (observabilityIncomplete(config.observability, { trackingEnabled, xapiEnabled })) {
    throw new Error(
      "[lessonkit] Production build missing observability hooks. Wire all five config.observability callbacks before go-live.",
    );
  }
}
