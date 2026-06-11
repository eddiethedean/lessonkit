import type { LessonkitConfig } from "../context";
import { assertTrackingSinkConfig } from "../provider/courseStarted/emit";
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
  return Boolean(tracking.sink || tracking.batchSink || tracking.createClient);
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
      observability?.onXapiMappingError,
    );
  }
  return required.some((hook) => !hook);
}

function requiredObservabilityHookCount(opts: { trackingEnabled: boolean; xapiEnabled: boolean }): number {
  let count = 1;
  if (opts.trackingEnabled) count += 2;
  if (opts.xapiEnabled) count += 4;
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
 * Production guard invoked from scaffolded `courseConfig.ts` on load.
 * No-op in development (warns when sinks look like `console.log`).
 *
 * @example
 * ```ts
 * import { assertProductionCourseConfig, shouldEnforceProductionGuard } from "@lessonkit/react";
 *
 * export const courseConfig = { tracking: { enabled: false }, xapi: { enabled: false } };
 * if (shouldEnforceProductionGuard()) assertProductionCourseConfig(courseConfig);
 * ```
 *
 * @throws When tracking is enabled without `sink`/`batchSink` in production.
 * @throws When `xapi.enabled` is true without `transport` or `client` in production.
 * @throws When console telemetry/xAPI sinks are used without `preview.allowConsoleTelemetry`.
 * @throws When required `config.observability` hooks are missing for enabled delivery.
 * @throws When `lxpack.bridge` is `"auto"` but `allowedParentOrigins` is empty in production.
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

  assertTrackingSinkConfig(config.tracking);

  const trackingImplicitlyEnabled = config.tracking === undefined || config.tracking.enabled !== false;
  if (trackingImplicitlyEnabled && !isTrackingDeliveryConfigured(config.tracking)) {
    throw new Error(
      "[lessonkit] Production build has tracking enabled but no sink or batchSink configured.",
    );
  }

  if (config.xapi?.enabled === true && !isXapiDeliveryConfigured(config.xapi)) {
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

  if (
    config.lxpack?.bridge === "auto" &&
    (!config.lxpack.allowedParentOrigins || config.lxpack.allowedParentOrigins.length === 0)
  ) {
    throw new Error(
      "[lessonkit] Production build uses lxpack bridge auto but allowedParentOrigins is missing. See production checklist.",
    );
  }
}

/**
 * Returns whether production guardrails should run (false in Vitest `MODE=test`).
 *
 * @example
 * ```ts
 * if (shouldEnforceProductionGuard()) assertProductionCourseConfig(courseConfig);
 * ```
 */
export { isProductionEnvironment, shouldEnforceProductionGuard };
