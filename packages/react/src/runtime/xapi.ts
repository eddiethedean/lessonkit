import type { CourseId } from "@lessonkit/core";
import type { XAPIClient, XAPIQueue, XAPITransport } from "@lessonkit/xapi";
import { createXAPIClient } from "@lessonkit/xapi";

export type XapiConfig = {
  enabled?: boolean;
  transport?: XAPITransport;
  client?: XAPIClient;
};

export function createXapiClientFromConfig(config: { courseId?: CourseId; xapi?: XapiConfig }, queue: XAPIQueue): XAPIClient | null {
  if (config.xapi?.enabled === false) return null;
  if (config.xapi?.client) return config.xapi.client;
  if (!config.courseId) return null;
  return createXAPIClient({
    courseId: config.courseId,
    transport: config.xapi?.transport,
    queue,
  });
}

