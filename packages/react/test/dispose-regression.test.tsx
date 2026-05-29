import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import type { TelemetryEvent } from "@lessonkit/core";
import { Lesson, LessonkitProvider, useLessonkit } from "../src";

describe("@lessonkit/react provider dispose regression", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.unmock("@lessonkit/core");
    vi.resetModules();
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
      const lk = useLk();
      runtime = lk;
      const { setActiveLesson } = lk;
      React.useEffect(() => {
        setActiveLesson("lesson-1");
        setActiveLesson("lesson-2");
      }, [setActiveLesson]);
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

  it("does not dispose the active tracking client during StrictMode remount", async () => {
    const disposedIds: number[] = [];
    let latestClientId = 0;

    vi.resetModules();
    vi.doMock("@lessonkit/core", async () => {
      const actual = await vi.importActual<typeof import("@lessonkit/core")>("@lessonkit/core");
      return {
        ...actual,
        createTrackingClient: () => {
          const id = ++latestClientId;
          return {
            track: vi.fn(),
            flush: vi.fn(),
            dispose: () => {
              disposedIds.push(id);
            },
          };
        },
      };
    });

    const mod = await import("../src");
    const { LessonkitProvider: Provider } = mod;

    const { unmount } = render(
      <React.StrictMode>
        <Provider config={{ courseId: "course-strict-dispose" }}>
          <div>child</div>
        </Provider>
      </React.StrictMode>,
    );

    await waitFor(() => expect(latestClientId).toBeGreaterThanOrEqual(1));
    const activeClientId = latestClientId;
    expect(disposedIds).not.toContain(activeClientId);

    const disposedBeforeUnmount = disposedIds.length;
    vi.useFakeTimers();
    unmount();
    await vi.runAllTimersAsync();
    vi.useRealTimers();

    expect(disposedIds.length).toBeGreaterThan(disposedBeforeUnmount);

    vi.unmock("@lessonkit/core");
  });

  it("completeLesson is idempotent for telemetry", async () => {
    const events: TelemetryEvent[] = [];

    let complete!: (lessonId: string) => void;
    function Driver() {
      const { setActiveLesson, completeLesson } = useLessonkit();
      React.useEffect(() => {
        setActiveLesson("lesson-1");
        complete = completeLesson;
      }, [setActiveLesson, completeLesson]);
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

  it("setActiveLesson completes the previous lesson", async () => {
    const events: TelemetryEvent[] = [];

    let runtime!: ReturnType<typeof useLessonkit>;
    function Driver() {
      const lk = useLessonkit();
      runtime = lk;
      const { setActiveLesson } = lk;
      React.useEffect(() => {
        setActiveLesson("lesson-1");
        setActiveLesson("lesson-2");
      }, [setActiveLesson]);
      return <div>driver</div>;
    }

    render(
      <LessonkitProvider
        config={{ courseId: "course-1", tracking: { sink: (e: TelemetryEvent) => void events.push(e) } }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => {
      expect(runtime.progress.activeLessonId).toBe("lesson-2");
      expect(runtime.progress.completedLessonIds.has("lesson-1")).toBe(true);
      expect(events.filter((e) => e.name === "lesson_completed" && e.lessonId === "lesson-1").length).toBe(
        1,
      );
    });
  });

  it("flushes lesson_completed on provider unmount with batched tracking", async () => {
    const events: TelemetryEvent[] = [];
    const sink = (e: TelemetryEvent) => {
      events.push(e);
    };

    const { unmount } = render(
      <LessonkitProvider
          config={{
            courseId: "course-1",
            tracking: {
              sink,
              batch: { enabled: true, flushIntervalMs: 60_000, maxBatchSize: 1 },
            },
          }}
        >
          <Lesson title="Lesson" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "lesson_started")).toBe(true));
    unmount();
    await waitFor(() =>
      expect(events.filter((e) => e.name === "lesson_completed" && e.lessonId === "lesson-1").length).toBe(
        1,
      ),
    );
  });

  it("migrates course_started dedup when session.sessionId changes", async () => {
    const events: TelemetryEvent[] = [];
    const sink = (e: TelemetryEvent) => void events.push(e);

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          session: { sessionId: "session-a" },
          tracking: { sink },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
    expect(events.filter((e) => e.name === "course_started")).toHaveLength(1);

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          session: { sessionId: "session-b" },
          tracking: { sink },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.filter((e) => e.name === "course_started")).toHaveLength(1));
  });

  it("Lesson under StrictMode does not complete until removed from the tree", async () => {
    const events: TelemetryEvent[] = [];

    const { unmount } = render(
      <React.StrictMode>
        <LessonkitProvider
          config={{ courseId: "course-1", tracking: { sink: (e: TelemetryEvent) => void events.push(e) } }}
        >
          <Lesson title="Lesson" lessonId="lesson-1">
            <div>child</div>
          </Lesson>
        </LessonkitProvider>
      </React.StrictMode>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "lesson_started")).toBe(true));
    await new Promise((r) => setTimeout(r, 20));
    expect(events.filter((e) => e.name === "lesson_completed").length).toBe(0);

    unmount();
    await waitFor(() =>
      expect(events.filter((e) => e.name === "lesson_completed" && e.lessonId === "lesson-1").length).toBe(
        1,
      ),
    );
  });
});
