import type { LessonkitConfig } from "../context";
import { isDevEnvironment } from "./validateComponentId";

function isProductionEnvironment(): boolean {
  try {
    if ((import.meta as { env?: { PROD?: boolean } }).env?.PROD === true) return true;
  } catch {
    // no import.meta
  }
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV === "production";
}

function shouldEnforceProductionGuard(): boolean {
  try {
    if ((import.meta as { env?: { MODE?: string } }).env?.MODE === "test") return false;
  } catch {
    // no import.meta
  }
  return isProductionEnvironment();
}

function looksLikeConsoleSink(fn: unknown): boolean {
  if (typeof fn !== "function") return false;
  const src = Function.prototype.toString.call(fn);
  return /console\.(log|debug|info)\s*\(/.test(src);
}

export function isTrackingDeliveryConfigured(
  tracking: LessonkitConfig["tracking"] | undefined,
): boolean {
  if (!tracking || tracking.enabled === false) return false;
  return Boolean(tracking.sink || tracking.batchSink);
}

export function isXapiDeliveryConfigured(xapi: LessonkitConfig["xapi"] | undefined): boolean {
  if (!xapi || xapi.enabled === false) return false;
  if (xapi.client) return true;
  return typeof xapi.transport === "function";
}

function trackingUsesConsole(config: Pick<LessonkitConfig, "tracking">): boolean {
  const tracking = config.tracking;
  if (!tracking || tracking.enabled === false) return false;
  if (tracking.consoleSink === true) return true;
  if (tracking.batchSink && looksLikeConsoleSink(tracking.batchSink)) return true;
  if (tracking.sink && looksLikeConsoleSink(tracking.sink)) return true;
  return false;
}

function xapiUsesConsole(config: Pick<LessonkitConfig, "xapi">): boolean {
  const xapi = config.xapi;
  if (!xapi || xapi.enabled === false || xapi.client) return false;
  if (xapi.consoleTransport === true) return true;
  return typeof xapi.transport === "function" && looksLikeConsoleSink(xapi.transport);
}

function observabilityIncomplete(
  observability: LessonkitConfig["observability"] | undefined,
  opts: { trackingEnabled: boolean; xapiEnabled: boolean },
): boolean {
  if (!opts.trackingEnabled && !opts.xapiEnabled) return false;
  const required: Array<unknown> = [observability?.onLxpackBridgeMiss];
  if (opts.trackingEnabled) {
    required.push(observability?.onTelemetrySinkError, observability?.onTelemetryBufferDrop);
  }
  if (opts.xapiEnabled) {
    required.push(
      observability?.onXapiQueueDepth,
      observability?.onXapiQueueCap,
      observability?.onXapiTransportError,
    );
  }
  return required.some((hook) => !hook);
}

function requiredObservabilityHookCount(opts: { trackingEnabled: boolean; xapiEnabled: boolean }): number {
  let count = 1;
  if (opts.trackingEnabled) count += 2;
  if (opts.xapiEnabled) count += 3;
  return count;
}

function warnConsoleSinkHeuristic(config: Pick<LessonkitConfig, "tracking" | "xapi" | "preview">): void {
  if (!isDevEnvironment()) return;
  if (config.preview?.allowConsoleTelemetry) return;
  if (looksLikeConsoleSink(config.tracking?.sink) || looksLikeConsoleSink(config.tracking?.batchSink)) {
    console.warn(
      "[lessonkit] Telemetry sink looks like console.log; use preview.allowConsoleTelemetry for docs or wire a real sink.",
    );
  }
  if (looksLikeConsoleSink(config.xapi?.transport)) {
    console.warn(
      "[lessonkit] xAPI transport looks like console.log; use preview.allowConsoleTelemetry for docs or wire createFetchTransport.",
    );
  }
}

/**
 * Throws in production when course config still uses dev-only console sinks or
 * omits observability hooks while telemetry/xAPI are enabled.
 */
export function assertProductionCourseConfig(
  config: Pick<
    LessonkitConfig,
    "tracking" | "xapi" | "observability" | "lxpack" | "preview"
  >,
): void {
  if (!isProductionEnvironment()) {
    warnConsoleSinkHeuristic(config);
    return;
  }

  const trackingImplicitlyEnabled = config.tracking === undefined || config.tracking.enabled !== false;
  if (trackingImplicitlyEnabled && !isTrackingDeliveryConfigured(config.tracking)) {
    throw new Error(
      "[lessonkit] Production build has tracking enabled but no sink or batchSink configured.",
    );
  }

  if (config.xapi?.enabled !== false && config.xapi !== undefined && !isXapiDeliveryConfigured(config.xapi)) {
    throw new Error(
      "[lessonkit] Production build has xAPI enabled but no transport or client configured.",
    );
  }

  const allowConsole = config.preview?.allowConsoleTelemetry === true;
  const trackingEnabled = isTrackingDeliveryConfigured(config.tracking);
  const xapiEnabled = isXapiDeliveryConfigured(config.xapi);

  if (!allowConsole && trackingUsesConsole(config)) {
    throw new Error(
      "[lessonkit] Production build uses console telemetry sinks. Wire createFetchBatchSink or a real sink. See production checklist.",
    );
  }
  if (!allowConsole && xapiUsesConsole(config)) {
    throw new Error(
      "[lessonkit] Production build uses console xAPI transport. Wire createFetchTransport to your LRS proxy. See production checklist.",
    );
  }
  if (observabilityIncomplete(config.observability, { trackingEnabled, xapiEnabled })) {
    const hookCount = requiredObservabilityHookCount({ trackingEnabled, xapiEnabled });
    throw new Error(
      `[lessonkit] Production build missing observability hooks. Wire all ${hookCount} config.observability callbacks before go-live.`,
    );
  }
}

export { isProductionEnvironment, shouldEnforceProductionGuard };
