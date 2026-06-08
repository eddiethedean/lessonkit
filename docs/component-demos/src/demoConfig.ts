import type { LessonkitConfig } from "@lessonkit/react";
import { allowConsoleTelemetryForDocsDemo } from "../../../examples/_shared/docsDemoConfig";

/** Docs-only runtime: no telemetry, xAPI, or LMS bridge. */
export const demoConfig: Omit<LessonkitConfig, "courseId"> = {
  tracking: { enabled: false },
  xapi: { enabled: false },
  lxpack: { bridge: "off" },
  ...allowConsoleTelemetryForDocsDemo(),
};
