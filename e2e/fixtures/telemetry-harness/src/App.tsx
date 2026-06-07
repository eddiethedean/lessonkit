import React, { useEffect, useMemo } from "react";
import type { TelemetryEvent } from "@lessonkit/core";
import type { XAPIStatement } from "@lessonkit/xapi";
import { Course, Lesson, Quiz, useCompletion, useLessonkit } from "@lessonkit/react";
import { initE2eApi, xapiModeRef, type XapiTransportMode } from "./e2e-globals";

function readInitialXapiMode(): XapiTransportMode {
  const params = new URLSearchParams(window.location.search);
  return params.get("xapiMode") === "fail" ? "fail" : "ok";
}

xapiModeRef.current = readInitialXapiMode();

const batches: TelemetryEvent[][] = [];
const xapiCalls: XAPIStatement[] = [];
let xapiErrors = 0;

function E2eBridge() {
  const { tracking, xapi } = useLessonkit();

  useEffect(() => {
    initE2eApi({
      batches,
      xapiCalls,
      xapiErrors,
      flushTracking: () => {
        tracking.flush?.();
      },
      flushXapi: async () => {
        try {
          await xapi?.flush();
        } catch {
          // flush may reject when transport still failing
        }
      },
      getXapiQueueSize: () => xapi?.queueSize() ?? 0,
    });
  }, [tracking, xapi]);

  return null;
}

function HarnessControls() {
  const { completeCourse } = useCompletion();

  return (
    <div data-testid="harness-controls">
      <button type="button" data-testid="flush-tracking" onClick={() => window.__e2e?.flushTracking()}>
        Flush tracking
      </button>
      <button type="button" data-testid="flush-xapi" onClick={() => void window.__e2e?.flushXapi()}>
        Flush xAPI
      </button>
      <button type="button" data-testid="complete-course" onClick={() => completeCourse()}>
        Complete course
      </button>
    </div>
  );
}

export default function App() {
  const config = useMemo(
    () => ({
      observability: {
        onTelemetrySinkError: () => undefined,
        onTelemetryBufferDrop: () => undefined,
        onXapiQueueDepth: () => undefined,
        onXapiQueueCap: () => undefined,
        onLxpackBridgeMiss: () => undefined,
        onXapiTransportError: () => undefined,
        onXapiMappingError: () => undefined,
      },
      tracking: {
        batch: { enabled: true, flushIntervalMs: 60_000, maxBatchSize: 25 },
        batchSink: (events: TelemetryEvent[]) => {
          batches.push([...events]);
        },
      },
      xapi: {
        transport: async (statement: XAPIStatement) => {
          if (xapiModeRef.current === "fail") {
            xapiErrors += 1;
            if (window.__e2e) window.__e2e.xapiErrors = xapiErrors;
            throw new Error("e2e xAPI transport failure");
          }
          xapiCalls.push(statement);
        },
      },
    }),
    [],
  );

  return (
    <Course title="Telemetry harness" courseId="e2e-telemetry" config={config}>
      <E2eBridge />
      <Lesson title="Lesson one" lessonId="lesson-1">
        <Quiz
          checkId="harness-check"
          question="Ready?"
          choices={["No", "Yes"]}
          answer="Yes"
        />
      </Lesson>
      <HarnessControls />
    </Course>
  );
}
