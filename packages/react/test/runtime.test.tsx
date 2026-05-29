import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { Course, KnowledgeCheck, Lesson, LessonkitProvider, ProgressTracker, Quiz, Reflection, Scenario, useCompletion, useLessonkit, useProgress, useQuizState, useTracking } from "../src";
import type { TelemetryEvent } from "@lessonkit/core";
import * as xapiModule from "@lessonkit/xapi";
import type { XAPIStatement, XAPITransport } from "@lessonkit/xapi";

describe("@lessonkit/react runtime", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("warns in dev when courseId is invalid", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");

    try {
      render(
        <Course
          title="Course"
          courseId={"1bad" as "course-1"}
          config={{ xapi: { enabled: false } }}
        >
          <div>child</div>
        </Course>,
      );
      await waitFor(() =>
        expect(warn).toHaveBeenCalledWith(expect.stringMatching(/invalid courseId/)),
      );
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

  it("throws a helpful error when used without provider", () => {
    function Bad() {
      useLessonkit();
      return null;
    }
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Bad />)).toThrow(/missing LessonkitProvider/);
    } finally {
      err.mockRestore();
    }
  });

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

  it("Reflection textarea is labeled with prompt or fallback aria-label", () => {
    const { getByLabelText, rerender } = render(<Reflection prompt="Prompt" />);
    expect(getByLabelText("Prompt")).toBeDefined();

    rerender(<Reflection />);
    expect(getByLabelText("Reflection response")).toBeDefined();
  });

  it("ProgressTracker reflects completion count and does not allow external mutation", async () => {
    const events: TelemetryEvent[] = [];

    let runtime!: ReturnType<typeof useLessonkit>;
    function Driver() {
      runtime = useLessonkit();
      const { completeLesson } = useCompletion();
      const { progress } = useLessonkit();
      const p = useProgress();
      const t = useTracking();

      // Use hooks so their lines are covered.
      expect(p).toBe(progress);
      expect(typeof t.track).toBe("function");

      React.useEffect(() => {
        completeLesson("lesson-1");
      }, [completeLesson]);

      return <ProgressTracker />;
    }

    const { getByText } = render(
      <LessonkitProvider
        config={{ courseId: "course-1", tracking: { sink: (e: TelemetryEvent) => void events.push(e) } }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(getByText(/Lessons completed:/).textContent).toContain("1"));

    // Defensive copy: mutating returned set shouldn't affect provider state.
    (runtime.progress.completedLessonIds as unknown as Set<string>).add("lesson-2");
    expect(getByText(/Lessons completed:/).textContent).toContain("1");
  });

  it("Course emits course_started once even if config changes", async () => {
    const events: TelemetryEvent[] = [];

    function Wrapper(props: { sink?: (e: TelemetryEvent) => void }) {
      return (
        <Course title="Course" courseId="course-1" config={{ tracking: { sink: props.sink } }}>
          <div>child</div>
        </Course>
      );
    }

    const { rerender } = render(<Wrapper sink={(e: TelemetryEvent) => void events.push(e)} />);

    // Changing sink causes a new tracking client to be created.
    rerender(<Wrapper sink={(e: TelemetryEvent) => void events.push(e)} />);

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
    expect(events.filter((e) => e.name === "course_started")).toHaveLength(1);
  });

  it("covers Scenario and KnowledgeCheck components", async () => {
    const events: TelemetryEvent[] = [];
    const { getAllByLabelText } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{ tracking: { sink: (e: TelemetryEvent) => void events.push(e) } }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Scenario>
            <p>scenario</p>
          </Scenario>
          <KnowledgeCheck checkId="check-1" question="Q" choices={["A"]} answer="A" />
        </Lesson>
      </Course>,
    );

    fireEvent.click(getAllByLabelText("A")[0]!);
    await waitFor(() => expect(events.some((e) => e.name === "quiz_answered")).toBe(true));
  });

  it("completeCourse is idempotent for telemetry", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { completeCourse } = useCompletion();
      React.useEffect(() => {
        completeCourse();
        completeCourse();
      }, [completeCourse]);
      return <div>driver</div>;
    }

    render(
      <LessonkitProvider
        config={{ courseId: "course-1", tracking: { sink: (e: TelemetryEvent) => void events.push(e) } }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.filter((e) => e.name === "course_completed").length).toBe(1));
  });

  it("completeCourse marks progress and tracks course_completed", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { completeCourse } = useCompletion();
      const { progress } = useLessonkit();
      React.useEffect(() => {
        completeCourse();
      }, [completeCourse]);
      return <div>{String(progress.courseCompleted)}</div>;
    }

    const { findByText } = render(
      <LessonkitProvider
        config={{ courseId: "course-1", tracking: { sink: (e: TelemetryEvent) => void events.push(e) } }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await findByText("true");
    expect(events.some((e) => e.name === "course_completed")).toBe(true);
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

  it("emits course_started xAPI statement on mount when transport is configured", async () => {
    const transport = vi.fn(async (_s: XAPIStatement) => {});

    render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          tracking: { enabled: false },
          xapi: { transport },
        }}
      >
        <div>child</div>
      </Course>,
    );

    await waitFor(() =>
      expect(
        transport.mock.calls.some((call) =>
          call[0]?.object.id?.includes("urn:lessonkit:course:course-1"),
        ),
      ).toBe(true),
    );
    expect(transport.mock.calls[0]?.[0]?.verb).toContain("initialized");
  });

  it("emits course_started to xAPI when transport is enabled after mount", async () => {
    const transport = vi.fn(async (_s: XAPIStatement) => {});

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          xapi: { enabled: false },
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
          xapi: { transport },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(
        transport.mock.calls.some(
          (call) =>
            call[0]?.verb?.includes("initialized") &&
            call[0]?.object.id?.includes("urn:lessonkit:course:course-1"),
        ),
      ).toBe(true),
    );
  });

  it("ignores xAPI mapping errors when enabling transport after course_started", async () => {
    const mapSpy = vi
      .spyOn(xapiModule, "telemetryEventToXAPIStatement")
      .mockImplementation(() => {
        throw new Error("map failed");
      });
    const transport = vi.fn(async (_s: XAPIStatement) => {});

    const { rerender } = render(
      <LessonkitProvider config={{ courseId: "course-1", xapi: { enabled: false } }}>
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(
        Object.keys(sessionStorage).some((k) => k.startsWith("lessonkit:course_started:")),
      ).toBe(true),
    );

    rerender(
      <LessonkitProvider config={{ courseId: "course-1", xapi: { transport } }}>
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(mapSpy).toHaveBeenCalled());
    expect(transport).not.toHaveBeenCalled();
    mapSpy.mockRestore();
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

  it("dedupes course_started per session and courseId", async () => {
    const events: TelemetryEvent[] = [];
    const sink = (e: TelemetryEvent) => void events.push(e);

    const { unmount } = render(
      <Course title="Course A" courseId="course-a" config={{ tracking: { sink } }}>
        <div>child</div>
      </Course>,
    );
    await waitFor(() => expect(events.filter((e) => e.name === "course_started").length).toBe(1));

    unmount();

    render(
      <Course title="Course B" courseId="course-b" config={{ tracking: { sink } }}>
        <div>child</div>
      </Course>,
    );
    await waitFor(() => expect(events.filter((e) => e.name === "course_started").length).toBe(2));
  });

  it("Quiz outside Lesson warns in dev and does not throw", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
    const events: TelemetryEvent[] = [];

    try {
      const { getByLabelText } = render(
        <Course
          title="Course"
          courseId="course-1"
          config={{ tracking: { sink: (e: TelemetryEvent) => void events.push(e) } }}
        >
          <Quiz checkId="check-1" question="Q" choices={["A", "B"]} answer="B" />
        </Course>,
      );

      fireEvent.click(getByLabelText("B"));
      await waitFor(() => expect(warn).toHaveBeenCalled());
      expect(events.some((e) => e.name === "quiz_answered")).toBe(false);
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
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
    expect(events.filter((e) => e.name === "course_started")).toHaveLength(1);
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

  it("resets progress and emits course_started when courseId changes", async () => {
    const events: TelemetryEvent[] = [];
    const sink = (e: TelemetryEvent) => {
      events.push(e);
    };

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-a",
          tracking: { sink },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </Lesson>
        <ProgressTracker />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
    const startedA = events.filter((e) => e.name === "course_started").length;

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-b",
          tracking: { sink },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </Lesson>
        <ProgressTracker />
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(events.filter((e) => e.name === "course_started").length).toBeGreaterThan(startedA),
    );
    expect(events.some((e) => e.name === "course_started" && e.courseId === "course-b")).toBe(true);
    await waitFor(() =>
      expect(events.filter((e) => e.name === "lesson_started" && e.courseId === "course-b").length).toBe(
        1,
      ),
    );

    const courseBStartedIdx = events.findIndex(
      (e) => e.name === "course_started" && e.courseId === "course-b",
    );
    const courseBLessonStartedIdx = events.findIndex(
      (e) => e.name === "lesson_started" && e.courseId === "course-b",
    );
    expect(courseBStartedIdx).toBeGreaterThanOrEqual(0);
    expect(courseBLessonStartedIdx).toBeGreaterThanOrEqual(0);
    expect(courseBStartedIdx).toBeLessThan(courseBLessonStartedIdx);
  });

  it("does not complete the previous active lesson under a new courseId when courseId changes", async () => {
    const events: TelemetryEvent[] = [];
    const sink = (e: TelemetryEvent) => {
      events.push(e);
    };

    function Driver() {
      const { setActiveLesson } = useLessonkit();
      React.useEffect(() => {
        setActiveLesson("lesson-2");
      }, [setActiveLesson]);
      return null;
    }

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-a",
          tracking: { sink },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div />
        </Lesson>
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(
        events.some((e) => e.name === "lesson_started" && e.lessonId === "lesson-2" && e.courseId === "course-a"),
      ).toBe(true),
    );

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-b",
          tracking: { sink },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div />
        </Lesson>
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.courseId === "course-b")).toBe(true));

    const stray = events.filter(
      (e) =>
        e.name === "lesson_completed" &&
        e.courseId === "course-b" &&
        e.lessonId === "lesson-2",
    );
    expect(stray).toHaveLength(0);
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

  it("emits course_started when tracking is re-enabled after disabled mount", async () => {
    const events: TelemetryEvent[] = [];

    const { rerender } = render(
      <LessonkitProvider config={{ courseId: "course-1", tracking: { enabled: false } }}>
        <div>child</div>
      </LessonkitProvider>,
    );

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { sink: (e: TelemetryEvent) => void events.push(e) },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
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
});

