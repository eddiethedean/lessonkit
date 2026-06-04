import React, { useState } from "react";
import { registerRuntimeTestCleanup } from "./runtime.testSetup";
import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Course, KnowledgeCheck, Lesson, LessonkitProvider, ProgressTracker, Quiz, Reflection, Scenario, useCompletion, useLessonkit, useProgress, useTracking } from "../src";
import { type TelemetryEvent } from "@lessonkit/core";


describe("@lessonkit/react runtime", () => {
  registerRuntimeTestCleanup();

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

it("does not auto-complete lesson under new courseId when lesson unmounts on course switch", async () => {
    const events: TelemetryEvent[] = [];
    const sink = (e: TelemetryEvent) => {
      events.push(e);
    };

    function CourseContent(props: { courseId: string }) {
      if (props.courseId === "course-a") {
        return (
          <Lesson title="L" lessonId="lesson-1">
            <div />
          </Lesson>
        );
      }
      return <div>other</div>;
    }

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-a",
          tracking: { sink },
          xapi: { enabled: false },
        }}
      >
        <CourseContent courseId="course-a" />
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(
        events.some((e) => e.name === "lesson_started" && e.courseId === "course-a"),
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
        <CourseContent courseId="course-b" />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.courseId === "course-b")).toBe(true));
    await act(async () => {
      await Promise.resolve();
    });

    const stray = events.filter(
      (e) =>
        e.name === "lesson_completed" &&
        e.courseId === "course-b" &&
        e.lessonId === "lesson-1",
    );
    expect(stray).toHaveLength(0);
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

