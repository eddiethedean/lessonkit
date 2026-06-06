import type { LessonkitConfig } from "@lessonkit/react";

/**
 * Docs demo bundles (DOCS_DEMO_BUILD / Vite `base: "./"`) intentionally log
 * telemetry to the console. Opt out of production guard checks for that build.
 */
export function allowConsoleTelemetryForDocsDemo(): Pick<LessonkitConfig, "preview"> {
  if (import.meta.env.BASE_URL !== "./") return {};
  return { preview: { allowConsoleTelemetry: true } };
}
