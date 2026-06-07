import type { LessonkitConfig } from "@lessonkit/react";

function viteBaseUrl(): string | undefined {
  const meta = import.meta as ImportMeta & { env?: { BASE_URL?: string } };
  return meta.env?.BASE_URL;
}

const docsDemoObservability: NonNullable<LessonkitConfig["observability"]> = {
  onTelemetrySinkError: () => undefined,
  onTelemetryBufferDrop: () => undefined,
  onXapiQueueDepth: () => undefined,
  onXapiQueueCap: () => undefined,
  onLxpackBridgeMiss: () => undefined,
  onXapiTransportError: () => undefined,
};

/**
 * Docs demo bundles (DOCS_DEMO_BUILD / Vite `base: "./"`) intentionally log
 * telemetry to the console. Opt out of production guard console checks for that build.
 */
export function allowConsoleTelemetryForDocsDemo(): Pick<
  LessonkitConfig,
  "preview" | "observability"
> {
  if (viteBaseUrl() !== "./") return {};
  return {
    preview: { allowConsoleTelemetry: true },
    observability: docsDemoObservability,
  };
}
