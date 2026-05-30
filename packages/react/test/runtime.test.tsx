import React, { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Course, KnowledgeCheck, Lesson, LessonkitProvider, ProgressTracker, Quiz, Reflection, Scenario, resetQuizWarningsForTests, useCompletion, useLessonkit, useProgress, useQuizState, useTracking } from "../src";
import { resetLessonMountRegistryForTests } from "../src/runtime/lessonMountRegistry";
import { resetLessonkitProviderStorageForTests } from "../src/provider/useLessonkitProviderRuntime";
import {
  defineAssessmentPlugin,
  defineLifecyclePlugin,
  defineTelemetryPlugin,
  type TelemetryEvent,
  type TelemetrySink,
} from "@lessonkit/core";
import * as xapiModule from "@lessonkit/xapi";
import type { XAPIStatement, XAPITransport } from "@lessonkit/xapi";
import * as emitTelemetryModule from "../src/runtime/emitTelemetry";

describe("@lessonkit/react runtime", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    resetQuizWarningsForTests();
    resetLessonMountRegistryForTests();
    resetLessonkitProviderStorageForTests();
  });

  it("throws in dev when courseId is invalid", async () => {
    vi.stubEnv("NODE_ENV", "development");

    try {
      expect(() =>
        render(
          <Course
            title="Course"
            courseId={"1bad" as "course-1"}
            config={{ xapi: { enabled: false } }}
          >
            <div>child</div>
          </Course>,
        ),
      ).toThrow(/courseId/);
    } finally {
      vi.unstubAllEnvs();
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

  it("keeps active lesson when duplicate lessonId unmounts", async () => {
    const events: TelemetryEvent[] = [];

    function ActiveLessonProbe() {
      const { progress } = useLessonkit();
      return (
        <div data-testid="active-lesson">{progress.activeLessonId ?? "none"}</div>
      );
    }

    function TwinLessons(props: { showFirst: boolean }) {
      return (
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
          <ActiveLessonProbe />
          {props.showFirst ? (
            <Lesson title="First" lessonId="lesson-1">
              <div>first</div>
            </Lesson>
          ) : null}
          <Lesson title="Second" lessonId="lesson-1">
            <div>second</div>
          </Lesson>
        </Course>
      );
    }

    const { rerender, getByTestId } = render(<TwinLessons showFirst={true} />);

    await waitFor(() => {
      expect(getByTestId("active-lesson").textContent).toBe("lesson-1");
    });

    const completedBefore = events.filter((e) => e.name === "lesson_completed" && e.lessonId === "lesson-1").length;

    rerender(<TwinLessons showFirst={false} />);

    await waitFor(() => {
      expect(getByTestId("active-lesson").textContent).toBe("lesson-1");
    });

    expect(events.filter((e) => e.name === "lesson_completed" && e.lessonId === "lesson-1").length).toBe(
      completedBefore,
    );
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

  it("runtimeVersion v2 uses headless lifecycle", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { setActiveLesson, completeCourse } = useLessonkit();
      React.useEffect(() => {
        setActiveLesson("lesson-1");
        completeCourse();
      }, [setActiveLesson, completeCourse]);
      return null;
    }

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          runtimeVersion: "v2",
          tracking: { sink: (e: TelemetryEvent) => void events.push(e) },
        }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => {
      expect(events.some((e) => e.name === "lesson_started")).toBe(true);
      expect(events.some((e) => e.name === "course_completed")).toBe(true);
    });
  });

  it("runtimeVersion v2 completeLesson tracks lesson completion", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { setActiveLesson, completeLesson } = useLessonkit();
      React.useEffect(() => {
        setActiveLesson("lesson-1");
        completeLesson("lesson-1");
      }, [setActiveLesson, completeLesson]);
      return null;
    }

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          runtimeVersion: "v2",
          tracking: { sink: (e: TelemetryEvent) => void events.push(e) },
        }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "lesson_completed")).toBe(true));
  });

  it("runtimeVersion v1 completes previous lesson when switching active lesson", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { setActiveLesson } = useLessonkit();
      React.useEffect(() => {
        setActiveLesson("lesson-1");
        setActiveLesson("lesson-2");
      }, [setActiveLesson]);
      return null;
    }

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          runtimeVersion: "v1",
          tracking: { sink: (e: TelemetryEvent) => void events.push(e) },
        }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => {
      expect(events.some((e) => e.name === "lesson_completed" && e.lessonId === "lesson-1")).toBe(
        true,
      );
      expect(events.some((e) => e.name === "lesson_started" && e.lessonId === "lesson-2")).toBe(
        true,
      );
    });
  });

  it("runtimeVersion v1 completeCourse uses legacy progress path", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { setActiveLesson, completeCourse } = useLessonkit();
      React.useEffect(() => {
        setActiveLesson("lesson-1");
        completeCourse();
      }, [setActiveLesson, completeCourse]);
      return null;
    }

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          runtimeVersion: "v1",
          tracking: { sink: (e: TelemetryEvent) => void events.push(e) },
        }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => {
      expect(events.some((e) => e.name === "lesson_completed")).toBe(true);
      expect(events.some((e) => e.name === "course_completed")).toBe(true);
    });
  });

  it("runtimeVersion v1 completeLesson uses legacy progress path", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { setActiveLesson, completeLesson } = useLessonkit();
      React.useEffect(() => {
        setActiveLesson("lesson-1");
        completeLesson("lesson-1");
      }, [setActiveLesson, completeLesson]);
      return null;
    }

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          runtimeVersion: "v1",
          tracking: { sink: (e: TelemetryEvent) => void events.push(e) },
        }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "lesson_completed")).toBe(true));
  });

  it("runtimeVersion v1 resets progress when courseId changes", () => {
    const { rerender } = render(
      <LessonkitProvider config={{ courseId: "course-1", runtimeVersion: "v1" }}>
        <div>one</div>
      </LessonkitProvider>,
    );

    rerender(
      <LessonkitProvider config={{ courseId: "course-2", runtimeVersion: "v1" }}>
        <div>two</div>
      </LessonkitProvider>,
    );
  });

  it("runtimeVersion v2 resets headless runtime when courseId changes", () => {
    const { rerender } = render(
      <LessonkitProvider config={{ courseId: "course-1", runtimeVersion: "v2" }}>
        <div>one</div>
      </LessonkitProvider>,
    );

    rerender(
      <LessonkitProvider config={{ courseId: "course-2", runtimeVersion: "v2" }}>
        <div>two</div>
      </LessonkitProvider>,
    );
  });

  it("completeCourse completes the active lesson first", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { completeCourse } = useCompletion();
      React.useEffect(() => {
        completeCourse();
      }, [completeCourse]);
      return <div>driver</div>;
    }

    render(
      <LessonkitProvider
        config={{ courseId: "course-1", tracking: { sink: (e: TelemetryEvent) => void events.push(e) } }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </Lesson>
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "lesson_completed")).toBe(true));
    await waitFor(() => expect(events.some((e) => e.name === "course_completed")).toBe(true));
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

  it("emits one course initialized xAPI when both tracking sink and transport are configured", async () => {
    const transport = vi.fn(async (_s: XAPIStatement) => {});
    const events: TelemetryEvent[] = [];

    render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          tracking: { sink: (e: TelemetryEvent) => void events.push(e) },
          xapi: { transport },
        }}
      >
        <div>child</div>
      </Course>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
    expect(events.filter((e) => e.name === "course_started")).toHaveLength(1);

    const courseInitialized = transport.mock.calls.filter(
      (call) =>
        call[0]?.verb?.includes("initialized") &&
        call[0]?.object.id === "urn:lessonkit:course:course-1",
    );
    expect(courseInitialized).toHaveLength(1);
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

  it("sends one course-level initialized when tracking disabled then enabled with xapi", async () => {
    const statements: XAPIStatement[] = [];
    const events: TelemetryEvent[] = [];
    const transport: XAPITransport = async (s) => {
      statements.push(s);
    };
    const courseUrn = "urn:lessonkit:course:course-1";
    const isCourseInit = (s: XAPIStatement) =>
      s.object.id === courseUrn &&
      s.verb === "http://adlnet.gov/expapi/verbs/initialized";

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { enabled: false },
          xapi: { transport },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(statements.some(isCourseInit)).toBe(true));

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { sink: (e: TelemetryEvent) => void events.push(e) },
          xapi: { transport },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(statements.filter(isCourseInit)).toHaveLength(1));
    await waitFor(() => expect(events.filter((e) => e.name === "course_started")).toHaveLength(1));
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

  it("emitCourseStarted skips storage marks when xAPI pipeline throws after tracking succeeds", async () => {
    const events: TelemetryEvent[] = [];
    const emitSpy = vi.spyOn(emitTelemetryModule, "emitTelemetry").mockImplementation(() => {
      throw new Error("xapi pipeline failed");
    });

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { sink: (e) => void events.push(e) },
          xapi: { transport: async () => {} },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
    expect(
      Object.keys(sessionStorage).some((k) => k.startsWith("lessonkit:course_started:")),
    ).toBe(false);
    expect(
      Object.keys(sessionStorage).some((k) => k.startsWith("lessonkit:course_started_tracking:")),
    ).toBe(true);

    emitSpy.mockRestore();
  });

  it("does not duplicate course_started tracking when pipeline fails then retries", async () => {
    const events: TelemetryEvent[] = [];
    let shouldThrow = true;
    const sinkA: TelemetrySink = (e) => void events.push(e);
    const sinkB: TelemetrySink = (e) => void events.push(e);
    const emitSpy = vi.spyOn(emitTelemetryModule, "emitTelemetry").mockImplementation(() => {
      if (shouldThrow) throw new Error("xapi pipeline failed");
    });

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { sink: sinkA },
          xapi: { transport: async () => {} },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
    expect(events.filter((e) => e.name === "course_started")).toHaveLength(1);

    shouldThrow = false;
    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { sink: sinkB },
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
    expect(events.filter((e) => e.name === "course_started")).toHaveLength(1);

    emitSpy.mockRestore();
  });

  it("forwards course_started to extraSinks when tracking enables after xAPI bootstrap", async () => {
    const pipelineEvents: TelemetryEvent[] = [];
    const extraSink = {
      id: "extra",
      emit: (e: TelemetryEvent) => void pipelineEvents.push(e),
    };
    const trackingEvents: TelemetryEvent[] = [];

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
    expect(pipelineEvents.filter((e) => e.name === "course_started")).toHaveLength(0);

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { sink: (e) => void trackingEvents.push(e) },
          xapi: { transport: async () => {} },
          sinks: [extraSink],
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(trackingEvents.some((e) => e.name === "course_started")).toBe(true));
    expect(trackingEvents.filter((e) => e.name === "course_started")).toHaveLength(1);
    expect(pipelineEvents.filter((e) => e.name === "course_started")).toHaveLength(1);
  });

  it("returns false from tracking-only bootstrap when bridge pipeline throws after tracking succeeds", async () => {
    const trackingEvents: TelemetryEvent[] = [];
    const emitSpy = vi.spyOn(emitTelemetryModule, "emitTelemetry").mockImplementation(() => {
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

    emitSpy.mockRestore();
  });

  it("emitCourseStarted returns early when plugin filters course_started", () => {
    const filterPlugin = defineTelemetryPlugin({
      id: "filter-start",
      version: "1",
      kind: "analytics",
      onTelemetry: (event) => (event.name === "course_started" ? null : event),
    });

    const events: TelemetryEvent[] = [];
    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          plugins: [filterPlugin],
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    expect(events.filter((e) => e.name === "course_started")).toHaveLength(0);
  });

  it("retries course_started to tracking after xAPI bootstrap when sink fails once", async () => {
    const events: TelemetryEvent[] = [];
    let shouldThrow = true;
    const transport: XAPITransport = async () => {};

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { enabled: false },
          xapi: { transport },
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
          tracking: {
            sink: (e: TelemetryEvent) => {
              if (e.name === "course_started" && shouldThrow) throw new Error("sink failed");
              events.push(e);
            },
          },
          xapi: { transport },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    expect(events.filter((e) => e.name === "course_started")).toHaveLength(0);

    shouldThrow = false;
    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { sink: (e: TelemetryEvent) => void events.push(e) },
          xapi: { transport },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
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

  it("Quiz does not complete on score-only plugin without explicit passed", async () => {
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
    expect(await screen.findByText("Try again")).toBeTruthy();
    expect(events.some((e) => e.name === "quiz_completed")).toBe(false);
  });

  it("Quiz feedback follows scoreAssessment passed flag", async () => {
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
    expect(await screen.findByText("Correct")).toBeTruthy();
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

  it("flushes batched events before course_started when courseId changes", async () => {
    const batches: TelemetryEvent[][] = [];
    const batchSink = async (events: TelemetryEvent[]) => {
      batches.push([...events]);
    };
    const batchConfig = { enabled: true, flushIntervalMs: 60_000, maxBatchSize: 1 };

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-a",
          tracking: { batchSink, batch: batchConfig },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(batches.some((b) => b.some((e) => e.name === "lesson_started" && e.courseId === "course-a"))).toBe(
        true,
      ),
    );

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-b",
          tracking: { batchSink, batch: batchConfig },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(batches.some((b) => b.some((e) => e.name === "course_started" && e.courseId === "course-b"))).toBe(
        true,
      ),
    );

    const courseBStartBatchIdx = batches.findIndex((b) =>
      b.some((e) => e.name === "course_started" && e.courseId === "course-b"),
    );
    const priorCourseAInSameBatch = batches
      .slice(0, courseBStartBatchIdx + 1)
      .some(
        (b) =>
          b.some((e) => e.name === "course_started" && e.courseId === "course-b") &&
          b.some((e) => e.courseId === "course-a" && e.name === "lesson_started"),
      );
    expect(priorCourseAInSameBatch).toBe(false);
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

  it("swallows flush errors on provider unmount", async () => {
    const trackingFlush = vi.fn().mockRejectedValue(new Error("tracking flush failed"));
    const trackingDispose = vi.fn().mockRejectedValue(new Error("tracking dispose failed"));
    const xapiClient = {
      send: vi.fn(),
      flush: vi.fn().mockRejectedValue(new Error("xapi flush failed")),
      queueSize: () => 0,
      startedLesson: vi.fn(),
      completeLesson: vi.fn(),
      completeCourse: vi.fn(),
    };

    vi.resetModules();
    vi.doMock("@lessonkit/core", async () => {
      const actual = await vi.importActual<typeof import("@lessonkit/core")>("@lessonkit/core");
      return {
        ...actual,
        createTrackingClient: () => ({
          track: vi.fn(),
          flush: trackingFlush,
          dispose: trackingDispose,
        }),
      };
    });

    const mod = await import("../src");
    const { unmount } = render(
      <mod.LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { sink: () => {} },
          xapi: { client: xapiClient },
        }}
      >
        <div>child</div>
      </mod.LessonkitProvider>,
    );

    unmount();
    await waitFor(() => expect(xapiClient.flush).toHaveBeenCalled());
    await waitFor(() => expect(trackingFlush).toHaveBeenCalled());
    await waitFor(() => expect(trackingDispose).toHaveBeenCalled());
    vi.unmock("@lessonkit/core");
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

  it("does not mark course_started when emit throws, then succeeds when sink changes", async () => {
    const events: TelemetryEvent[] = [];
    let shouldThrow = true;
    const failingSink = (e: TelemetryEvent) => {
      if (e.name === "course_started" && shouldThrow) throw new Error("sink failed");
      events.push(e);
    };
    const okSink = (e: TelemetryEvent) => {
      events.push(e);
    };

    const { rerender } = render(
      <LessonkitProvider
        config={{ courseId: "course-1", tracking: { sink: failingSink }, xapi: { enabled: false } }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    expect(events.some((e) => e.name === "course_started")).toBe(false);

    shouldThrow = false;
    rerender(
      <LessonkitProvider
        config={{ courseId: "course-1", tracking: { sink: okSink }, xapi: { enabled: false } }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(events.some((e) => e.name === "course_started" && e.courseId === "course-1")).toBe(true),
    );
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

  it("emits course_started after courseId change when flush fails once", async () => {
    const events: TelemetryEvent[] = [];
    let failNextFlush = false;

    vi.resetModules();
    vi.doMock("@lessonkit/core", async () => {
      const actual = await vi.importActual<typeof import("@lessonkit/core")>("@lessonkit/core");
      return {
        ...actual,
        createTrackingClient: (
          opts?: Parameters<typeof import("@lessonkit/core").createTrackingClient>[0],
        ) => {
          const real = actual.createTrackingClient(opts);
          return {
            ...real,
            flush: async () => {
              if (failNextFlush) {
                failNextFlush = false;
                throw new Error("flush failed");
              }
              return real.flush?.();
            },
          };
        },
      };
    });

    const mod = await import("../src");
    const { rerender } = render(
      <mod.LessonkitProvider
        config={{
          courseId: "course-a",
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <mod.Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </mod.Lesson>
      </mod.LessonkitProvider>,
    );

    await waitFor(() =>
      expect(events.some((e) => e.name === "course_started" && e.courseId === "course-a")).toBe(true),
    );

    failNextFlush = true;
    rerender(
      <mod.LessonkitProvider
        config={{
          courseId: "course-b",
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <mod.Lesson title="L" lessonId="lesson-1">
          <div>content</div>
        </mod.Lesson>
      </mod.LessonkitProvider>,
    );

    await waitFor(() =>
      expect(events.some((e) => e.name === "course_started" && e.courseId === "course-b")).toBe(true),
    );
    vi.unmock("@lessonkit/core");
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

  it("normalizes padded courseId in telemetry payloads", async () => {
    const events: TelemetryEvent[] = [];

    render(
      <Course
        title="Course"
        courseId={" my-course " as "my-course"}
        config={{ tracking: { sink: (e) => void events.push(e) } }}
      >
        <Lesson title="Lesson" lessonId=" lesson-1 ">
          <Quiz checkId=" check-1 " question="Q" choices={["A", "B"]} answer="B" />
        </Lesson>
      </Course>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
    const started = events.find((e) => e.name === "course_started");
    expect(started?.courseId).toBe("my-course");
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

  it("duplicate Lesson unmount does not steal active lesson from another lesson", async () => {
    const events: TelemetryEvent[] = [];

    function ActiveLessonProbe() {
      const { progress } = useLessonkit();
      return <div data-testid="active-lesson">{progress.activeLessonId ?? "none"}</div>;
    }

    function Harness() {
      const [showFirstA, setShowFirstA] = useState(true);
      return (
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
          <ActiveLessonProbe />
          {showFirstA ? (
            <Lesson title="A1" lessonId="lesson-a">
              <div>a1</div>
            </Lesson>
          ) : null}
          <Lesson title="A2" lessonId="lesson-a">
            <div>a2</div>
          </Lesson>
          <Lesson title="B" lessonId="lesson-b">
            <div>b</div>
          </Lesson>
          <button type="button" onClick={() => setShowFirstA(false)}>
            remove first A
          </button>
        </Course>
      );
    }

    const { getByRole, getByTestId } = render(<Harness />);

    await waitFor(() => {
      expect(getByTestId("active-lesson").textContent).toBe("lesson-b");
    });

    const startedForB = events.filter((e) => e.name === "lesson_started" && e.lessonId === "lesson-b").length;
    const startedForA = events.filter((e) => e.name === "lesson_started" && e.lessonId === "lesson-a").length;

    fireEvent.click(getByRole("button", { name: "remove first A" }));

    await waitFor(() => {
      expect(getByTestId("active-lesson").textContent).toBe("lesson-b");
    });

    expect(events.filter((e) => e.name === "lesson_started" && e.lessonId === "lesson-b").length).toBe(
      startedForB,
    );
    expect(events.filter((e) => e.name === "lesson_started" && e.lessonId === "lesson-a").length).toBe(
      startedForA,
    );
  });

  it("warns in dev when multiple lessons mount concurrently", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");

    try {
      render(
        <Course title="Course" courseId="course-1">
          <Lesson title="A" lessonId="lesson-a">
            <div>a</div>
          </Lesson>
          <Lesson title="B" lessonId="lesson-b">
            <div>b</div>
          </Lesson>
        </Course>,
      );

      await waitFor(() =>
        expect(warn).toHaveBeenCalledWith(expect.stringMatching(/Multiple <Lesson>/)),
      );
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

  it("ProgressTracker exposes progressbar semantics when totalLessons is set", () => {
    render(
      <Course title="Course" courseId="course-1">
        <ProgressTracker totalLessons={3} />
      </Course>,
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuemax")).toBe("3");
    expect(bar.getAttribute("aria-valuenow")).toBe("0");
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

  it("runtimeVersion toggle resets progress when switching v1 to v2", async () => {
    const events: TelemetryEvent[] = [];
    function ToggleRuntime() {
      const [version, setVersion] = useState<"v1" | "v2">("v1");
      return (
        <>
          <button type="button" onClick={() => setVersion("v2")}>
            use-v2
          </button>
          <LessonkitProvider
            config={{
              courseId: "course-toggle-v2",
              runtimeVersion: version,
              tracking: { sink: (e) => void events.push(e) },
            }}
          >
            <Lesson title="L" lessonId="lesson-1">
              <div>content</div>
            </Lesson>
          </LessonkitProvider>
        </>
      );
    }

    const { getByRole } = render(<ToggleRuntime />);
    await waitFor(() => expect(events.some((e) => e.name === "lesson_started")).toBe(true));
    fireEvent.click(getByRole("button", { name: "use-v2" }));
    await waitFor(() => {
      expect(
        events.filter((e) => e.name === "lesson_started" && e.lessonId === "lesson-1").length,
      ).toBe(2);
    });
  });

  it("runtimeVersion v1 skips lesson_started when remounting a completed lesson", async () => {
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
              courseId: "course-remount-v1",
              runtimeVersion: "v1",
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
    await waitFor(() =>
      expect(events.filter((e) => e.name === "lesson_started").length).toBe(startedCount),
    );
  });

  it("runtimeVersion toggle resets progress when switching v2 to v1", async () => {
    const events: TelemetryEvent[] = [];
    function ToggleRuntime() {
      const [version, setVersion] = useState<"v1" | "v2">("v2");
      return (
        <>
          <button type="button" onClick={() => setVersion("v1")}>
            use-v1
          </button>
          <LessonkitProvider
            config={{
              courseId: "course-toggle",
              runtimeVersion: version,
              tracking: { sink: (e) => void events.push(e) },
            }}
          >
            <Lesson title="L" lessonId="lesson-1">
              <div>content</div>
            </Lesson>
          </LessonkitProvider>
        </>
      );
    }

    const { getByRole } = render(<ToggleRuntime />);
    await waitFor(() => expect(events.some((e) => e.name === "lesson_started")).toBe(true));
    fireEvent.click(getByRole("button", { name: "use-v1" }));
    await waitFor(() => {
      const startedAfterToggle = events.filter(
        (e) => e.name === "lesson_started" && e.lessonId === "lesson-1",
      ).length;
      expect(startedAfterToggle).toBe(2);
    });
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

  it("Reflection supports uncontrolled textarea changes and optional hint", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <Course title="Course" courseId="course-1">
        <Lesson title="Lesson" lessonId="lesson-1">
          <Reflection prompt="Reflect" hint="Optional hint" onChange={onChange} />
        </Lesson>
      </Course>,
    );

    const textarea = getByLabelText("Reflect") as HTMLTextAreaElement;
    expect(textarea.getAttribute("aria-describedby")).toBeTruthy();
    fireEvent.change(textarea, { target: { value: "My notes" } });
    expect(onChange).toHaveBeenCalledWith("My notes");
    expect(textarea.value).toBe("My notes");
  });
});

