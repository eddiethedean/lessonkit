import type { LessonkitConfig } from "@lessonkit/react";

const docsDemoObservability: NonNullable<LessonkitConfig["observability"]> = {
  onTelemetrySinkError: () => undefined,
  onTelemetryBufferDrop: () => undefined,
  onXapiQueueDepth: () => undefined,
  onXapiQueueCap: () => undefined,
  onLxpackBridgeMiss: () => undefined,
  onXapiTransportError: () => undefined,
  onXapiMappingError: () => undefined,
  onInvalidSessionId: () => undefined,
};

function isDocsDemoBundle(): boolean {
  // Access BASE_URL directly so Vite inlines it at build time (optional chaining breaks inlining).
  if (import.meta.env.BASE_URL === "./") return true;
  return import.meta.env.VITE_DOCS_DEMO === "1";
}

/**
 * Docs demo bundles (DOCS_DEMO_BUILD / Vite `base: "./"`) intentionally log
 * telemetry to the console. Opt out of production guard console checks for that build.
 */
export function allowConsoleTelemetryForDocsDemo(): Pick<
  LessonkitConfig,
  "preview" | "observability"
> {
  if (!isDocsDemoBundle()) return {};
  return {
    preview: { allowConsoleTelemetry: true },
    observability: docsDemoObservability,
  };
}
