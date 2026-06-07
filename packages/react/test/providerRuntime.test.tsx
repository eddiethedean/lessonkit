import React from "react";
import { registerRuntimeTestCleanup } from "./runtime.testSetup";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { Course, Lesson, LessonkitProvider } from "../src";
import { defineTelemetryPlugin, type TelemetryEvent } from "@lessonkit/core";

describe("useLessonkitProviderRuntime edge cases", () => {
  registerRuntimeTestCleanup();

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses updated sessionId after config change", async () => {
    const events: TelemetryEvent[] = [];

    function Wrapper(props: { sessionId: string }) {
      return (
        <Course
          title="Course"
          courseId="course-1"
          config={{
            session: { sessionId: props.sessionId },
            tracking: { sink: (e) => void events.push(e) },
            xapi: { enabled: false },
          }}
        >
          <Lesson title="L" lessonId="lesson-1">
            <div>content</div>
          </Lesson>
        </Course>
      );
    }

    const { rerender } = render(<Wrapper sessionId="session-a" />);
    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
    expect(events.find((e) => e.name === "course_started")?.sessionId).toBe("session-a");

    events.length = 0;
    rerender(<Wrapper sessionId="session-b" />);
    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
    expect(events.find((e) => e.name === "course_started")?.sessionId).toBe("session-b");
  });

  it("warns when runtimeVersion v1 is configured", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <LessonkitProvider config={{ courseId: "c", runtimeVersion: "v1", xapi: { enabled: false } }}>
        <div>child</div>
      </LessonkitProvider>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('runtimeVersion "v1"'));
    warn.mockRestore();
  });

  it("allows tracking and xAPI disabled without production guard errors in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() =>
      render(
        <LessonkitProvider
          config={{
            courseId: "course-1",
            tracking: { enabled: false },
            xapi: { enabled: false },
          }}
        >
          <div>child</div>
        </LessonkitProvider>,
      ),
    ).not.toThrow();
  });

  it("composes plugin wrapTrackingSink returning null without crashing batch delivery", async () => {
    const batches: TelemetryEvent[][] = [];
    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          plugins: [
            defineTelemetryPlugin({
              id: "null-wrap",
              version: "1",
              kind: "analytics",
              wrapTrackingSink: () => null as unknown as import("@lessonkit/core").TelemetrySink,
            }),
          ],
          tracking: {
            batchSink: async (events) => {
              batches.push(events);
            },
            batch: { enabled: true, flushIntervalMs: 60_000, maxBatchSize: 1 },
          },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(batches.some((b) => b.some((e) => e.name === "course_started"))).toBe(true),
    );
  });
});
