import type { CourseId } from "@lessonkit/core";
import type { XAPIClient, XAPIQueue, XAPITransport } from "@lessonkit/xapi";
import { createXAPIClient } from "@lessonkit/xapi";
import type { LessonkitObservabilityConfig } from "./observability";

export type XapiConfig = {
  enabled?: boolean;
  transport?: XAPITransport;
  exitTransport?: import("@lessonkit/xapi").XAPIExitTransport;
  client?: XAPIClient;
};

export function createXapiClientFromConfig(
  config: { courseId?: CourseId; xapi?: XapiConfig },
  queue: XAPIQueue,
  observability?: LessonkitObservabilityConfig,
): XAPIClient | null {
  if (config.xapi?.enabled === false) return null;
  if (config.xapi?.client) return config.xapi.client;
  if (!config.courseId) return null;
  const hasTransport = typeof config.xapi?.transport === "function";
  if (!hasTransport && config.xapi?.enabled !== true) return null;
  return createXAPIClient({
    courseId: config.courseId,
    transport: config.xapi?.transport,
    exitTransport: config.xapi?.exitTransport,
    queue,
    onTransportError: observability?.onXapiTransportError,
  });
}

