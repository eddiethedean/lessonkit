import React, { useState } from "react";
import { registerRuntimeTestCleanup } from "./runtime.testSetup";
import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Course, Lesson, LessonkitProvider, Quiz, TrueFalse, useLessonkit, useQuizState, useTracking } from "../src";
import {
  createSessionStoragePort,
  defineAssessmentPlugin,
  defineLifecyclePlugin,
  defineTelemetryPlugin,
  type TelemetryEvent,
  type TelemetrySink,
} from "@lessonkit/core";
import type { XAPIStatement } from "@lessonkit/xapi";
import * as courseStartedPipelineModule from "../src/runtime/courseStartedPipeline";


describe("@lessonkit/react runtime — telemetry", () => {
  registerRuntimeTestCleanup();

it("tracks quiz_answered with expected payload", async () => {
    const events: TelemetryEvent[] = [];

    const { getByLabelText } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          tracking: {
            sink: (e: TelemetryEvent) => {
              events.push(e);
            },
          },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz checkId="check-1" question="Q" choices={["A", "B"]} answer="B" />
        </Lesson>
      </Course>,
    );

    fireEvent.click(getByLabelText("A"));

    fireEvent.click(getByLabelText("B"));

    await waitFor(() => {
      expect(events.some((e) => e.name === "quiz_answered")).toBe(true);
      expect(events.some((e) => e.name === "quiz_completed")).toBe(true);
    });

    const quizAnswered = events.find((e) => e.name === "quiz_answered");
    expect(quizAnswered).toBeDefined();
    if (!quizAnswered) throw new Error("missing quiz_answered");
    expect(quizAnswered.data).toMatchObject({
      checkId: "check-1",
      question: "Q",
      choice: "A",
      correct: false,
    });
    expect(quizAnswered.courseId).toBe("course-1");
    expect(quizAnswered.lessonId).toBe("lesson-1");
    expect(typeof quizAnswered.sessionId).toBe("string");
  });

it("Quiz telemetry uses enclosing Lesson when multiple lessons are mounted", async () => {
    const events: TelemetryEvent[] = [];

    const { getByLabelText } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          tracking: {
            sink: (e: TelemetryEvent) => {
              events.push(e);
            },
          },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="Lesson A" lessonId="lesson-a">
          <Quiz checkId="shared-check" question="Q in A" choices={["A1", "A2"]} answer="A2" />
        </Lesson>
        <Lesson title="Lesson B" lessonId="lesson-b">
          <div>lesson b body</div>
        </Lesson>
      </Course>,
    );

    await waitFor(() => {
      expect(events.some((e) => e.name === "lesson_started" && e.lessonId === "lesson-b")).toBe(true);
    });

    fireEvent.click(getByLabelText("A2"));

    await waitFor(() => {
      expect(events.some((e) => e.name === "quiz_completed")).toBe(true);
    });

    const quizEvents = events.filter(
      (e) => e.name === "quiz_answered" || e.name === "quiz_completed",
    );
    expect(quizEvents.length).toBeGreaterThan(0);
    for (const e of quizEvents) {
      expect(e.lessonId).toBe("lesson-a");
    }
  });

it("plugins wrap batchSink when batching is enabled", async () => {
    const batches: TelemetryEvent[][] = [];
    const dropInteractions = defineTelemetryPlugin({
      id: "test.drop-interaction",
      version: "1",
      kind: "analytics",
      onTelemetry: (event) => (event.name === "interaction" ? null : event),
    });

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          plugins: [dropInteractions],
          tracking: {
            batch: { enabled: true, flushIntervalMs: 50, maxBatchSize: 10 },
            batchSink: (events: TelemetryEvent[]) => {
              batches.push(events);
            },
          },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() => {
      expect(batches.some((b) => b.some((e) => e.name === "course_started"))).toBe(true);
    });
    expect(batches.flat().some((e) => e.name === "interaction")).toBe(false);
  });

it("plugins can filter telemetry via onTelemetry", async () => {
    const events: TelemetryEvent[] = [];
    const dropInteractions = defineTelemetryPlugin({
      id: "test.drop-interaction",
      version: "1",
      kind: "analytics",
      onTelemetry: (event) => (event.name === "interaction" ? null : event),
    });

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          plugins: [dropInteractions],
          tracking: {
            sink: (e: TelemetryEvent) => {
              events.push(e);
            },
          },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() => {
      expect(events.some((e) => e.name === "course_started")).toBe(true);
    });
    expect(events.some((e) => e.name === "interaction")).toBe(false);
  });

it("QuizState.complete emits quiz_completed", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const quiz = useQuizState();
      const { progress } = useLessonkit();
      React.useEffect(() => {
        if (!progress.activeLessonId) return;
        quiz.complete({ checkId: "check-1", score: 1, maxScore: 2 });
      }, [quiz, progress.activeLessonId]);
      return <div>driver</div>;
    }

    render(
      <LessonkitProvider
        config={{ courseId: "course-1", tracking: { sink: (e: TelemetryEvent) => void events.push(e) } }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Driver />
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "quiz_completed")).toBe(true));
  });

it("tracks lesson lifecycle and emits duration on completion", async () => {
    let now = 0;
    const dateNow = vi.spyOn(Date, "now").mockImplementation(() => now);

    const events: TelemetryEvent[] = [];
    const sink = (e: TelemetryEvent) => {
      events.push(e);
    };

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
      <LessonkitProvider config={{ courseId: "course-1", tracking: { sink } }}>
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => {
      expect(events.some((e) => e.name === "lesson_started")).toBe(true);
    });

    now = 5000;
    complete("lesson-1");

    const completed = events.find((e) => e.name === "lesson_completed");
    expect(completed).toBeDefined();
    if (!completed) throw new Error("missing lesson_completed");
    expect(completed.lessonId).toBe("lesson-1");
    expect(completed.data).toMatchObject({ lessonId: "lesson-1", durationMs: 5000 });

    const tot = events.find((e) => e.name === "lesson_time_on_task");
    expect(tot).toBeDefined();
    if (!tot) throw new Error("missing lesson_time_on_task");
    expect(tot.data).toMatchObject({ lessonId: "lesson-1", durationMs: 5000 });

    dateNow.mockRestore();
  });

it("wrapTrackingSink preserves stateful wrappers across events", async () => {
    let eventCount = 0;
    const events: TelemetryEvent[] = [];
    const plugin = defineTelemetryPlugin({
      id: "stateful-wrap",
      version: "1",
      kind: "analytics",
      wrapTrackingSink: (sink) => (event) => {
        eventCount += 1;
        return sink(event);
      },
    });

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          plugins: [plugin],
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.length).toBeGreaterThanOrEqual(2));
    expect(eventCount).toBeGreaterThanOrEqual(2);
  });

it("re-runs plugin setup and dispose when session.user changes", async () => {
    const log: string[] = [];
    const plugin = defineLifecyclePlugin({
      id: "lifecycle-user",
      version: "1",
      kind: "lms",
      setup() {
        log.push("setup");
      },
      dispose() {
        log.push("dispose");
      },
    });

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          runtimeVersion: "v1",
          plugins: [plugin],
          session: { user: { id: "user-a" } },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(log).toEqual(["setup"]));

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          runtimeVersion: "v1",
          plugins: [plugin],
          session: { user: { id: "user-b" } },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(log).toEqual(["setup", "dispose", "setup"]));
  });

it("wrapTrackingSink applies to batched flushes when batchSink is configured", async () => {
    let wrapCount = 0;
    const batches: TelemetryEvent[][] = [];
    const plugin = defineTelemetryPlugin({
      id: "stateful-wrap-batch",
      version: "1",
      kind: "analytics",
      wrapTrackingSink: (sink) => (event) => {
        wrapCount += 1;
        return sink(event);
      },
    });

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          plugins: [plugin],
          tracking: {
            batch: { enabled: true, flushIntervalMs: 50, maxBatchSize: 10 },
            batchSink: (events) => {
              batches.push(events);
            },
          },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(batches.length).toBeGreaterThan(0));
    expect(wrapCount).toBeGreaterThan(0);
    expect(batches.flat().length).toBeGreaterThan(0);
  });

it("tracking disabled does not invoke sink", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { track } = useTracking();
      React.useEffect(() => {
        track("interaction", { kind: "noop" });
      }, [track]);
      return <div>driver</div>;
    }

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { enabled: false, sink: (e: TelemetryEvent) => void events.push(e) },
        }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await new Promise((r) => setTimeout(r, 10));
    expect(events).toHaveLength(0);
  });

it("xAPI can be disabled and does not emit statements", async () => {
    const transport = vi.fn(async (_s: XAPIStatement) => {});
    const events: TelemetryEvent[] = [];

    render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          tracking: { sink: (e: TelemetryEvent) => void events.push(e) },
          xapi: { enabled: false, transport },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </Course>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "lesson_started")).toBe(true));
    expect(transport).not.toHaveBeenCalled();
  });

it("xAPI client injection receives statements from telemetry mapper", async () => {
    const statements: XAPIStatement[] = [];
    const send = vi.fn((s: XAPIStatement) => {
      statements.push(s);
    });

    const { unmount } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          xapi: {
            client: {
              send,
              flush: async () => {},
              queueSize: () => 0,
              startedLesson: () => {},
              completeLesson: () => {},
              completeCourse: () => {},
            },
          },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </Course>,
    );

    await waitFor(() => expect(send).toHaveBeenCalled());
    expect(statements.some((s) => s.object.id?.includes(":lesson:lesson-1"))).toBe(true);

    unmount();
  });

it("flushes queued xAPI statements when transport changes", async () => {
    const statements: XAPIStatement[] = [];
    const failingTransport = vi.fn(async () => {
      throw new Error("network");
    });
    const okTransport = vi.fn(async (s: XAPIStatement) => {
      statements.push(s);
    });

    const { rerender } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{ xapi: { transport: failingTransport } }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </Course>,
    );

    await waitFor(() => expect(failingTransport).toHaveBeenCalled());
    expect(statements).toHaveLength(0);

    rerender(
      <Course
        title="Course"
        courseId="course-1"
        config={{ xapi: { transport: okTransport } }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </Course>,
    );

    await waitFor(() => expect(statements.length).toBeGreaterThan(0));
  });

it("does not block next xAPI flush if previous client flush rejects", async () => {
    const client1 = {
      send: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error("flush failed");
      }),
      queueSize: vi.fn(() => 0),
      startedLesson: vi.fn(),
      completeLesson: vi.fn(),
      completeCourse: vi.fn(),
    };

    const client2 = {
      send: vi.fn(),
      flush: vi.fn(async () => {}),
      queueSize: vi.fn(() => 0),
      startedLesson: vi.fn(),
      completeLesson: vi.fn(),
      completeCourse: vi.fn(),
    };

    const { rerender } = render(
      <Course title="Course" courseId="course-1" config={{ xapi: { client: client1 } }}>
        <Lesson title="Lesson" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </Course>,
    );

    rerender(
      <Course title="Course" courseId="course-1" config={{ xapi: { client: client2 } }}>
        <Lesson title="Lesson" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </Course>,
    );

    await waitFor(() => expect(client2.flush).toHaveBeenCalled());
  });

it("resolveSessionId falls back when sessionStorage is unavailable", async () => {
    const events: TelemetryEvent[] = [];
    const original = globalThis.sessionStorage;
    Object.defineProperty(globalThis, "sessionStorage", {
      value: undefined,
      configurable: true,
    });

    render(
      <LessonkitProvider
        config={{ courseId: "course-1", tracking: { sink: (e: TelemetryEvent) => void events.push(e) } }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
    expect(events[0]?.sessionId).toBeTruthy();

    Object.defineProperty(globalThis, "sessionStorage", {
      value: original,
      configurable: true,
    });
  });

it("does not crash if sessionStorage throws and still provides a sessionId", async () => {
    const events: TelemetryEvent[] = [];
    const original = globalThis.sessionStorage;

    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
      },
      configurable: true,
    });

    render(
      <LessonkitProvider
        config={{ courseId: "course-1", tracking: { sink: (e: TelemetryEvent) => void events.push(e) } }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
    expect(events[0]?.sessionId).toBeTruthy();

    Object.defineProperty(globalThis, "sessionStorage", {
      value: original,
      configurable: true,
    });
  });

it("Quiz outside Lesson throws in dev", () => {
    vi.stubEnv("NODE_ENV", "development");

    try {
      expect(() =>
        render(
          <Course
            title="Course"
            courseId="course-1"
            config={{ tracking: { sink: () => {} } }}
          >
            <Quiz checkId="check-1" question="Q" choices={["A", "B"]} answer="B" />
          </Course>,
        ),
      ).toThrow(/must be wrapped in <Lesson>/);
    } finally {
      vi.unstubAllEnvs();
    }
  });

it("Quiz outside Lesson shows alert and skips telemetry in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const events: TelemetryEvent[] = [];

    try {
      const { getByRole } = render(
        <Course
          title="Course"
          courseId="course-1"
          config={{ tracking: { sink: (e: TelemetryEvent) => void events.push(e) } }}
        >
          <Quiz checkId="check-1" question="Q" choices={["A", "B"]} answer="B" />
        </Course>,
      );

      expect(getByRole("alert").textContent).toMatch(/inside a Lesson/i);
      expect(events.some((e) => e.name === "quiz_answered")).toBe(false);
      expect(error).toHaveBeenCalledWith(expect.stringMatching(/must be wrapped in <Lesson>/));
    } finally {
      vi.unstubAllEnvs();
      error.mockRestore();
    }
  });

it("updates runtime.session when session config changes", async () => {
    function SessionReader() {
      const { session } = useLessonkit();
      return <div data-testid="user">{session.user?.id ?? "none"}</div>;
    }

    const { getByTestId, rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          session: { user: { id: "user-a" } },
        }}
      >
        <SessionReader />
      </LessonkitProvider>,
    );

    expect(getByTestId("user").textContent).toBe("user-a");

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          session: { user: { id: "user-b" } },
        }}
      >
        <SessionReader />
      </LessonkitProvider>,
    );

    expect(getByTestId("user").textContent).toBe("user-b");
  });

it("updates runtime.session.sessionId when session.sessionId changes", async () => {
    const events: TelemetryEvent[] = [];
    const sink = (e: TelemetryEvent) => void events.push(e);

    function SessionReader() {
      const { session } = useLessonkit();
      return <div data-testid="session-id">{session.sessionId}</div>;
    }

    const { getByTestId, rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          session: { sessionId: "session-a" },
          tracking: { sink },
          xapi: { enabled: false },
        }}
      >
        <SessionReader />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
    expect(getByTestId("session-id").textContent).toBe("session-a");
    expect(events.find((e) => e.name === "course_started")?.sessionId).toBe("session-a");

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          session: { sessionId: "session-b" },
          tracking: { sink },
          xapi: { enabled: false },
        }}
      >
        <SessionReader />
      </LessonkitProvider>,
    );

    expect(getByTestId("session-id").textContent).toBe("session-b");
    await waitFor(() =>
      expect(events.filter((e) => e.name === "course_started")).toHaveLength(2),
    );
    expect(events.filter((e) => e.name === "course_started").at(-1)?.sessionId).toBe("session-b");
  });

it("emits quiz_completed again when checkId changes on a mounted Quiz", async () => {
    const events: TelemetryEvent[] = [];
    const sink = (e: TelemetryEvent) => void events.push(e);

    const { getByLabelText, rerender } = render(
      <LessonkitProvider
        config={{ courseId: "course-1", tracking: { sink }, xapi: { enabled: false } }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz checkId="check-a" question="Q1" choices={["A", "B"]} answer="A" />
        </Lesson>
      </LessonkitProvider>,
    );

    fireEvent.click(getByLabelText("A"));
    await waitFor(() =>
      expect(events.filter((e) => e.name === "quiz_completed" && e.data?.checkId === "check-a").length).toBe(1),
    );

    rerender(
      <LessonkitProvider
        config={{ courseId: "course-1", tracking: { sink }, xapi: { enabled: false } }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz checkId="check-b" question="Q2" choices={["X", "Y"]} answer="Y" />
        </Lesson>
      </LessonkitProvider>,
    );

    fireEvent.click(getByLabelText("Y"));
    await waitFor(() =>
      expect(events.filter((e) => e.name === "quiz_completed" && e.data?.checkId === "check-b").length).toBe(1),
    );
    expect(events.filter((e) => e.name === "quiz_completed").length).toBe(2);
  });

it("still flushes new xAPI client when previous client flush is slow", async () => {
    let releaseSlowFlush!: () => void;
    const slowFlushGate = new Promise<void>((resolve) => {
      releaseSlowFlush = resolve;
    });

    const client1 = {
      send: vi.fn(),
      flush: vi.fn(async () => {
        await slowFlushGate;
      }),
      queueSize: vi.fn(() => 0),
      startedLesson: vi.fn(),
      completeLesson: vi.fn(),
      completeCourse: vi.fn(),
    };

    const client2 = {
      send: vi.fn(),
      flush: vi.fn(async () => {}),
      queueSize: vi.fn(() => 0),
      startedLesson: vi.fn(),
      completeLesson: vi.fn(),
      completeCourse: vi.fn(),
    };

    const { rerender } = render(
      <Course title="Course" courseId="course-1" config={{ xapi: { client: client1 } }}>
        <Lesson title="Lesson" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </Course>,
    );

    await waitFor(() => expect(client1.flush).toHaveBeenCalled());

    rerender(
      <Course title="Course" courseId="course-1" config={{ xapi: { client: client2 } }}>
        <Lesson title="Lesson" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </Course>,
    );

    releaseSlowFlush();
    await waitFor(() => expect(client2.flush).toHaveBeenCalled());
  });

it("reverts to tab session id when configured sessionId is cleared", async () => {
    function Reader() {
      const { session } = useLessonkit();
      return <span data-testid="sid">{session.sessionId}</span>;
    }

    const { rerender, getByTestId } = render(
      <LessonkitProvider config={{ courseId: "course-1", session: { sessionId: "lms-a" } }}>
        <Reader />
      </LessonkitProvider>,
    );

    expect(getByTestId("sid").textContent).toBe("lms-a");

    rerender(
      <LessonkitProvider config={{ courseId: "course-1" }}>
        <Reader />
      </LessonkitProvider>,
    );

    expect(getByTestId("sid").textContent).not.toBe("lms-a");
  });

it("throws when tracking sink and batchSink are both configured in development", () => {
    vi.stubEnv("NODE_ENV", "development");

    const config = {
      courseId: "course-1" as const,
      tracking: {
        sink: () => {},
        batchSink: async () => {},
        batch: { enabled: true, flushIntervalMs: 60_000 },
      },
      xapi: { enabled: false as const },
    };

    try {
      expect(() =>
        render(
          <LessonkitProvider config={config}>
            <div>child</div>
          </LessonkitProvider>,
        ),
      ).toThrow(/tracking\.sink and tracking\.batchSink/);
    } finally {
      vi.unstubAllEnvs();
    }
  });

it("returns false from tracking-only bootstrap when bridge pipeline throws after tracking succeeds", async () => {
    const trackingEvents: TelemetryEvent[] = [];
    const emitSpy = vi
      .spyOn(courseStartedPipelineModule, "emitCourseStartedNonTrackingPipeline")
      .mockImplementation(async () => {
        throw new Error("pipeline failed");
      });

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { enabled: false },
          xapi: { transport: async () => {} },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(
        Object.keys(sessionStorage).some((k) => k.startsWith("lessonkit:course_started:")),
      ).toBe(true),
    );

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { sink: (e) => void trackingEvents.push(e) },
          xapi: { transport: async () => {} },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(trackingEvents.some((e) => e.name === "course_started")).toBe(true));
    expect(trackingEvents.filter((e) => e.name === "course_started")).toHaveLength(1);
    expect(
      Object.keys(sessionStorage).some((k) =>
        k.startsWith("lessonkit:course_started_pipeline:"),
      ),
    ).toBe(false);

    emitSpy.mockRestore();
  });

it("retries extraSinks when pipeline fails then succeeds after xAPI bootstrap", async () => {
    const pipelineEvents: TelemetryEvent[] = [];
    let shouldThrow = true;
    const extraSink = {
      id: "extra",
      emit: (e: TelemetryEvent) => {
        if (shouldThrow) throw new Error("extra sink failed");
        pipelineEvents.push(e);
      },
    };

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { enabled: false },
          xapi: { transport: async () => {} },
          sinks: [extraSink],
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(
        Object.keys(sessionStorage).some((k) => k.startsWith("lessonkit:course_started:")),
      ).toBe(true),
    );

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { sink: () => {} },
          xapi: { transport: async () => {} },
          sinks: [extraSink],
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(
        Object.keys(sessionStorage).some((k) =>
          k.startsWith("lessonkit:course_started_tracking:"),
        ),
      ).toBe(true),
    );
    expect(
      Object.keys(sessionStorage).some((k) =>
        k.startsWith("lessonkit:course_started_pipeline:"),
      ),
    ).toBe(false);

    shouldThrow = false;
    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { sink: (e) => void pipelineEvents.push(e) },
          xapi: { transport: async () => {} },
          sinks: [extraSink],
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(
        Object.keys(sessionStorage).some((k) =>
          k.startsWith("lessonkit:course_started_pipeline:"),
        ),
      ).toBe(true),
    );
    expect(pipelineEvents.filter((e) => e.name === "course_started")).toHaveLength(1);
  });

it("flushes batched telemetry when setActiveLesson completes the previous lesson", async () => {
    const batches: TelemetryEvent[][] = [];
    const batchSink = async (events: TelemetryEvent[]) => {
      batches.push(events);
    };

    function Nav() {
      const { setActiveLesson } = useLessonkit();
      return (
        <button type="button" onClick={() => setActiveLesson("lesson-2")}>
          next
        </button>
      );
    }

    const { getByRole } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { batchSink, batch: { enabled: true, flushIntervalMs: 60_000 } },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="One" lessonId="lesson-1">
          <div>one</div>
        </Lesson>
        <Lesson title="Two" lessonId="lesson-2">
          <div>two</div>
        </Lesson>
        <Nav />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(batches.some((b) => b.some((e) => e.name === "lesson_started"))).toBe(true));
    fireEvent.click(getByRole("button", { name: "next" }));
    await waitFor(() =>
      expect(batches.some((b) => b.some((e) => e.name === "lesson_completed"))).toBe(true),
    );
  });

it("Quiz uses scoreAssessment plugin with maxScore ratio", async () => {
    const events: TelemetryEvent[] = [];
    const plugin = defineAssessmentPlugin({
      id: "scorer-ratio",
      version: "1",
      kind: "assessment",
      scoreAssessment: () => ({ score: 1, maxScore: 1 }),
    });

    const { getByLabelText } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          plugins: [plugin],
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz checkId="check-1" question="Q?" choices={["wrong", "right"]} answer="right" />
        </Lesson>
      </Course>,
    );

    fireEvent.click(getByLabelText("wrong"));
    await waitFor(() =>
      expect(events.some((e) => e.name === "quiz_completed" && e.data?.checkId === "check-1")).toBe(
        true,
      ),
    );
  });

it("Quiz defaults passingScore to plugin maxScore when prop is omitted", async () => {
    const events: TelemetryEvent[] = [];
    const plugin = defineAssessmentPlugin({
      id: "scorer-max-four",
      version: "1",
      kind: "assessment",
      scoreAssessment: () => ({ score: 4, maxScore: 4, passed: true }),
    });

    const { getByLabelText } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          plugins: [plugin],
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz checkId="check-1" question="Q?" choices={["wrong", "right"]} answer="right" />
        </Lesson>
      </Course>,
    );

    fireEvent.click(getByLabelText("right"));
    await waitFor(() =>
      expect(
        events.some(
          (e) =>
            e.name === "quiz_completed" &&
            e.data?.checkId === "check-1" &&
            e.data?.maxScore === 4 &&
            e.data?.passingScore === 4,
        ),
      ).toBe(true),
    );
  });

it("Quiz multi-select Check uses scoreAssessment plugin", async () => {
    const events: TelemetryEvent[] = [];
    const plugin = defineAssessmentPlugin({
      id: "scorer-multi",
      version: "1",
      kind: "assessment",
      scoreAssessment: () => ({ score: 99, maxScore: 99, passed: true }),
    });

    const { getByLabelText, getByTestId } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          plugins: [plugin],
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz
            checkId="check-multi"
            question="Select all risks"
            choices={["A", "B", "C"]}
            answer="A"
            answers={["A", "B"]}
          />
        </Lesson>
      </Course>,
    );

    fireEvent.click(getByLabelText("A"));
    fireEvent.click(getByLabelText("B"));
    fireEvent.click(getByTestId("quiz-check"));
    await waitFor(() =>
      expect(
        events.some(
          (e) =>
            e.name === "quiz_completed" &&
            e.data?.checkId === "check-multi" &&
            e.data?.score === 99 &&
            e.data?.maxScore === 99,
        ),
      ).toBe(true),
    );
  });

it("Quiz rejects plugin numeric score when maxScore is zero", async () => {
    const events: TelemetryEvent[] = [];
    const plugin = defineAssessmentPlugin({
      id: "scorer-score",
      version: "1",
      kind: "assessment",
      scoreAssessment: () => ({ score: 1, maxScore: 0 }),
    });

    const { getByLabelText } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          plugins: [plugin],
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz checkId="check-1" question="Q?" choices={["x", "y"]} answer="right" />
        </Lesson>
      </Course>,
    );

    await act(async () => {
      fireEvent.click(getByLabelText("x"));
    });
    expect(screen.queryByText("Correct")).toBeNull();
    expect(events.some((e) => e.name === "quiz_completed")).toBe(false);
  });

it("Quiz does not complete when plugin score is below passing threshold", async () => {
    const events: TelemetryEvent[] = [];
    const plugin = defineAssessmentPlugin({
      id: "scorer-below",
      version: "1",
      kind: "assessment",
      scoreAssessment: () => ({ score: 1, maxScore: 4 }),
    });

    const { getByLabelText } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          plugins: [plugin],
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz checkId="check-1" question="Q?" choices={["x", "y"]} answer="right" />
        </Lesson>
      </Course>,
    );

    await act(async () => {
      fireEvent.click(getByLabelText("x"));
    });
    expect(await screen.findByText("Try again")).toBeTruthy();
    expect(events.some((e) => e.name === "quiz_completed")).toBe(false);
  });

it("Quiz UI shows factual correctness while plugin can still mark passed", async () => {
    const plugin = defineAssessmentPlugin({
      id: "scorer-pass",
      version: "1",
      kind: "assessment",
      scoreAssessment: () => ({ passed: true, score: 1, maxScore: 1 }),
    });

    const { getByLabelText } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          plugins: [plugin],
          tracking: { enabled: false },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz checkId="check-1" question="Q?" choices={["wrong", "right"]} answer="right" />
        </Lesson>
      </Course>,
    );

    await act(async () => {
      fireEvent.click(getByLabelText("wrong"));
    });
    expect(await screen.findByText("Try again")).toBeTruthy();
    expect((getByLabelText("wrong") as HTMLInputElement).disabled).toBe(true);
  });

it("onTelemetryBatch receives current courseId after courseId change", async () => {
    const batchCtxCourseIds: string[] = [];
    const batches: TelemetryEvent[][] = [];
    const plugin = defineTelemetryPlugin({
      id: "batch-ctx",
      version: "1",
      kind: "analytics",
      onTelemetryBatch: (_events, ctx) => {
        batchCtxCourseIds.push(ctx.courseId);
      },
    });

    const trackingConfig = {
      batchSink: async (events: TelemetryEvent[]) => {
        batches.push(events);
      },
      batch: { enabled: true, flushIntervalMs: 60_000, maxBatchSize: 1 },
    };

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-a",
          plugins: [plugin],
          tracking: trackingConfig,
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(batches.length).toBeGreaterThan(0));

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-b",
          plugins: [plugin],
          tracking: trackingConfig,
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(batchCtxCourseIds.some((id) => id === "course-b")).toBe(true));
  });

it("warns and flushes injected xapi client when courseId changes in development", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");

    const client = {
      send: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined),
      queueSize: () => 0,
      startedLesson: vi.fn(),
      completeLesson: vi.fn(),
      completeCourse: vi.fn(),
    };

    try {
      const { rerender } = render(
        <LessonkitProvider config={{ courseId: "course-a", xapi: { client } }}>
          <div>child</div>
        </LessonkitProvider>,
      );

      rerender(
        <LessonkitProvider config={{ courseId: "course-b", xapi: { client } }}>
          <div>child</div>
        </LessonkitProvider>,
      );

      await waitFor(() =>
        expect(warn).toHaveBeenCalledWith(expect.stringMatching(/courseId changed/)),
      );
      expect(client.flush).toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

it("drops queued xAPI when courseId changes", async () => {
    const statements: XAPIStatement[] = [];
    const failingTransport = vi.fn(async () => {
      throw new Error("network");
    });
    const okTransport = vi.fn(async (s: XAPIStatement) => {
      statements.push(s);
    });

    const { rerender } = render(
      <LessonkitProvider config={{ courseId: "course-a", xapi: { transport: failingTransport } }}>
        <Lesson title="Lesson" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(failingTransport).toHaveBeenCalled());

    rerender(
      <LessonkitProvider config={{ courseId: "course-b", xapi: { transport: okTransport } }}>
        <Lesson title="Lesson" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(okTransport).toHaveBeenCalled());
    expect(statements.length).toBeGreaterThan(0);
    expect(statements.every((s) => s.object.id?.includes("course-b"))).toBe(true);
    expect(statements.some((s) => s.object.id?.includes("course-a"))).toBe(false);
  });

it("falls back to base sink when wrapTrackingSink returns undefined", async () => {
    const events: TelemetryEvent[] = [];
    const plugin = defineTelemetryPlugin({
      id: "wrap-undefined",
      version: "1",
      kind: "analytics",
      wrapTrackingSink: () => undefined as unknown as TelemetrySink,
    });

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          plugins: [plugin],
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "lesson_started")).toBe(true));
  });

it("wrapTrackingSink receives fresh plugin context per event", async () => {
    const ctxCourseIds: string[] = [];
    const events: TelemetryEvent[] = [];
    const plugin = defineTelemetryPlugin({
      id: "wrap-ctx",
      version: "1",
      kind: "analytics",
      wrapTrackingSink: (sink, ctx) => (event) => {
        ctxCourseIds.push(ctx.courseId);
        return sink(event);
      },
    });

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-a",
          plugins: [plugin],
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(ctxCourseIds.some((id) => id === "course-a")).toBe(true));

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-b",
          plugins: [plugin],
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(ctxCourseIds.some((id) => id === "course-b")).toBe(true));
  });

it("Quiz legend uses visually hidden styles without sr-only class", () => {
    const { container } = render(
      <Course title="Course" courseId="course-1">
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz checkId="check-1" question="Q" choices={["A"]} answer="A" />
        </Lesson>
      </Course>,
    );
    const legend = container.querySelector("legend");
    expect(legend).toBeTruthy();
    expect(legend?.className).not.toContain("sr-only");
    expect(legend?.getAttribute("style")).toContain("position: absolute");
  });

it("Lesson autoCompleteOnUnmount=false skips lesson_completed on unmount", async () => {
    const events: TelemetryEvent[] = [];

    const { unmount } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{ tracking: { sink: (e) => void events.push(e) } }}
      >
        <Lesson title="A" lessonId="lesson-a" autoCompleteOnUnmount={false}>
          <div>content</div>
        </Lesson>
      </Course>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "lesson_started")).toBe(true));
    unmount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(events.some((e) => e.name === "lesson_completed")).toBe(false);
  });

it("Quiz disables choices after a correct answer", async () => {
    const { getByLabelText } = render(
      <Course title="Course" courseId="course-1">
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz checkId="check-1" question="Q" choices={["A", "B"]} answer="B" />
        </Lesson>
      </Course>,
    );

    fireEvent.click(getByLabelText("B"));
    await waitFor(() => expect((getByLabelText("B") as HTMLInputElement).disabled).toBe(true));
    expect((getByLabelText("A") as HTMLInputElement).disabled).toBe(true);
  });

it("does not emit lesson_started again when remounting a completed lesson", async () => {
    const events: TelemetryEvent[] = [];
    function RemountLesson() {
      const [mounted, setMounted] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setMounted(false)}>
            unmount
          </button>
          <button type="button" onClick={() => setMounted(true)}>
            remount
          </button>
          <LessonkitProvider
            config={{
              courseId: "course-remount",
              tracking: { sink: (e) => void events.push(e) },
            }}
          >
            {mounted ? (
              <Lesson title="L" lessonId="lesson-1">
                <div>content</div>
              </Lesson>
            ) : null}
          </LessonkitProvider>
        </>
      );
    }

    const { getByRole } = render(<RemountLesson />);
    await waitFor(() => expect(events.some((e) => e.name === "lesson_started")).toBe(true));
    fireEvent.click(getByRole("button", { name: "unmount" }));
    await waitFor(() => expect(events.some((e) => e.name === "lesson_completed")).toBe(true));
    const startedCount = events.filter((e) => e.name === "lesson_started").length;
    fireEvent.click(getByRole("button", { name: "remount" }));
    await waitFor(() => expect(events.filter((e) => e.name === "lesson_started").length).toBe(startedCount));
  });

  it("Quiz quiz_answered uses factual correctness not passing threshold", async () => {
    const events: TelemetryEvent[] = [];
    const plugin = defineAssessmentPlugin({
      id: "partial-mcq",
      version: "1",
      kind: "assessment",
      scoreAssessment: () => ({ score: 1, maxScore: 1, passed: true }),
    });

    const { getByLabelText } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          tracking: {
            sink: (e: TelemetryEvent) => {
              events.push(e);
            },
          },
          plugins: [plugin],
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz checkId="check-1" question="Q" choices={["A", "B"]} answer="B" />
        </Lesson>
      </Course>,
    );

    fireEvent.click(getByLabelText("A"));

    await waitFor(() => {
      const answered = events.find((e) => e.name === "quiz_answered");
      expect(answered?.data).toMatchObject({ choice: "A", correct: false });
    });
  });

  it("TrueFalse assessment_answered uses factual correctness not plugin pass", async () => {
    const events: TelemetryEvent[] = [];
    const plugin = defineAssessmentPlugin({
      id: "tf-pass-all",
      version: "1",
      kind: "assessment",
      scoreAssessment: () => ({ score: 1, maxScore: 1, passed: true }),
    });

    const { getByLabelText } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          tracking: {
            sink: (e: TelemetryEvent) => {
              events.push(e);
            },
          },
          plugins: [plugin],
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <TrueFalse checkId="check-tf" question="Sky is blue?" answer={true} />
        </Lesson>
      </Course>,
    );

    fireEvent.click(getByLabelText("False"));

    await waitFor(() => {
      const answered = events.find((e) => e.name === "assessment_answered");
      expect(answered?.data).toMatchObject({ response: false, correct: false });
    });
  });

  it("warns via onStoragePortChangeIgnored when storage changes in production", () => {
    const onStoragePortChangeIgnored = vi.fn();
    const storageA = createSessionStoragePort();
    const storageB = createSessionStoragePort();
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    function StorageSwapHarness() {
      const [storage, setStorage] = useState(storageA);
      return (
        <>
          <button type="button" onClick={() => setStorage(storageB)}>
            swap
          </button>
          <LessonkitProvider
            config={{
              courseId: "course-1",
              storage,
              observability: { onStoragePortChangeIgnored },
            }}
          >
            <span>child</span>
          </LessonkitProvider>
        </>
      );
    }

    const { getByRole } = render(<StorageSwapHarness />);
    fireEvent.click(getByRole("button", { name: "swap" }));
    expect(onStoragePortChangeIgnored).toHaveBeenCalledTimes(1);
    process.env.NODE_ENV = prevEnv;
  });
});

