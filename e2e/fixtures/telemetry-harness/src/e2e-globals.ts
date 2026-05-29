import type { TelemetryEvent } from "@lessonkit/core";
import type { XAPIStatement } from "@lessonkit/xapi";

export type XapiTransportMode = "ok" | "fail";

export type E2eHarnessApi = {
  batches: TelemetryEvent[][];
  xapiCalls: XAPIStatement[];
  xapiErrors: number;
  xapiMode: XapiTransportMode;
  setXapiMode: (mode: XapiTransportMode) => void;
  flushTracking: () => void;
  flushXapi: () => Promise<void>;
  getXapiQueueSize: () => number;
};

declare global {
  interface Window {
    __e2e?: E2eHarnessApi;
  }
}

export const xapiModeRef: { current: XapiTransportMode } = { current: "ok" };

export function initE2eApi(api: Omit<E2eHarnessApi, "setXapiMode" | "xapiMode">): void {
  window.__e2e = {
    ...api,
    get xapiMode() {
      return xapiModeRef.current;
    },
    setXapiMode(mode: XapiTransportMode) {
      xapiModeRef.current = mode;
    },
  };
}
