import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import type { TelemetryEvent } from "@lessonkit/core";
import { LessonkitProvider, useLessonkit } from "../src";

describe("@lessonkit/react provider dispose regression", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("does not dispose tracking client on lesson transitions", async () => {
    const dispose = vi.fn();

    vi.resetModules();
    vi.doMock("@lessonkit/core", async () => {
      const actual = await vi.importActual<typeof import("@lessonkit/core")>("@lessonkit/core");
      return {
        ...actual,
        createTrackingClient: () => ({
          track: vi.fn(),
          flush: vi.fn(),
          dispose,
        }),
      };
    });

    const mod = await import("../src");
    const { LessonkitProvider: Provider, useLessonkit: useLk } = mod;

    let runtime!: ReturnType<typeof useLk>;
    function Driver() {
      runtime = useLk();
      React.useEffect(() => {
        runtime.setActiveLesson("lesson-1");
        runtime.setActiveLesson("lesson-2");
      }, [runtime]);
      return <div>driver</div>;
    }

    const sink = vi.fn();
    const { unmount } = render(
      <Provider config={{ courseId: "course-1", tracking: { sink } }}>
        <Driver />
      </Provider>,
    );

    await waitFor(() => {
      expect(runtime.progress.activeLessonId).toBe("lesson-2");
    });

    // Allow Strict Mode / initial client swap to settle; lesson transitions must not dispose.
    dispose.mockClear();
    expect(dispose).not.toHaveBeenCalled();
    unmount();
    expect(dispose).toHaveBeenCalledTimes(1);

    vi.unmock("@lessonkit/core");
  });

  it("disposes previous tracking client when sink changes", async () => {
    const dispose = vi.fn();

    vi.resetModules();
    vi.doMock("@lessonkit/core", async () => {
      const actual = await vi.importActual<typeof import("@lessonkit/core")>("@lessonkit/core");
      return {
        ...actual,
        createTrackingClient: () => ({
          track: vi.fn(),
          flush: vi.fn(),
          dispose,
        }),
      };
    });

    const mod = await import("../src");
    const { LessonkitProvider: Provider } = mod;

    const sink1 = vi.fn();
    const sink2 = vi.fn();

    const { rerender } = render(
      <Provider config={{ courseId: "course-1", tracking: { sink: sink1 } }}>
        <div>child</div>
      </Provider>,
    );

    rerender(
      <Provider config={{ courseId: "course-1", tracking: { sink: sink2 } }}>
        <div>child</div>
      </Provider>,
    );

    expect(dispose).toHaveBeenCalledTimes(1);
    vi.unmock("@lessonkit/core");
  });

  it("flushes batched events on unmount under StrictMode", async () => {
    const events: TelemetryEvent[] = [];
    const sink = (e: TelemetryEvent) => {
      events.push(e);
    };

    function Driver() {
      const { track } = useLessonkit();
      React.useEffect(() => {
        track("interaction", { kind: "buffered" });
      }, [track]);
      return null;
    }

    const { unmount } = render(
      <React.StrictMode>
        <LessonkitProvider
          config={{
            courseId: "course-1",
            tracking: {
              sink,
              batch: { enabled: true, flushIntervalMs: 60_000, maxBatchSize: 100 },
            },
          }}
        >
          <Driver />
        </LessonkitProvider>
      </React.StrictMode>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
    const interactionsBeforeUnmount = events.filter((e) => e.name === "interaction").length;

    unmount();
    await waitFor(() =>
      expect(events.filter((e) => e.name === "interaction").length).toBeGreaterThan(interactionsBeforeUnmount),
    );
  });

  it("emits course_started once and keeps sessionId across StrictMode remount", async () => {
    const events: TelemetryEvent[] = [];
    const sessionIds = new Set<string>();

    function Spy() {
      const { session } = useLessonkit();
      sessionIds.add(session.sessionId);
      return null;
    }

    render(
      <React.StrictMode>
        <LessonkitProvider
          config={{
            courseId: "course-strict",
            tracking: { sink: (e: TelemetryEvent) => void events.push(e) },
          }}
        >
          <Spy />
        </LessonkitProvider>
      </React.StrictMode>,
    );

    await waitFor(() => expect(events.filter((e) => e.name === "course_started").length).toBe(1));
    expect(sessionIds.size).toBe(1);
    const started = events.find((e) => e.name === "course_started");
    expect(started?.sessionId).toBe([...sessionIds][0]);
    expect(started?.courseId).toBe("course-strict");
  });

  it("completeLesson is idempotent for telemetry", async () => {
    const events: TelemetryEvent[] = [];

    let complete!: (lessonId: string) => void;
    function Driver() {
      const runtime = useLessonkit();
      React.useEffect(() => {
        runtime.setActiveLesson("lesson-1");
        complete = runtime.completeLesson;
      }, [runtime]);
      return <div>driver</div>;
    }

    render(
      <LessonkitProvider
        config={{ courseId: "course-1", tracking: { sink: (e: TelemetryEvent) => void events.push(e) } }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "lesson_started")).toBe(true));

    complete("lesson-1");
    complete("lesson-1");

    await waitFor(() => expect(events.filter((e) => e.name === "lesson_completed").length).toBe(1));
  });
});
