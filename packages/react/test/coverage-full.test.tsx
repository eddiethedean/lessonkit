import React, { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import { defineTelemetryPlugin } from "@lessonkit/core";
import {
  Course,
  Lesson,
  LessonkitProvider,
  Quiz,
  Reflection,
  useCompletion,
  useLessonkit,
  resetQuizWarningsForTests,
} from "../src";
import {
  resetCourseStartedTrackingFlightForTests,
  resetLessonkitProviderStorageForTests,
} from "../src/provider/useLessonkitProviderRuntime";
import {
  getLessonMountCount,
  registerLessonMount,
  resetLessonMountRegistryForTests,
} from "../src/runtime/lessonMountRegistry";
import { emitCourseStartedNonTrackingPipeline } from "../src/runtime/courseStartedPipeline";
import { emitThroughPipeline } from "../src/runtime/telemetryPipeline";
import * as xapiMapModule from "@lessonkit/xapi";
import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";

function seedStorage(key: string): void {
  sessionStorage.setItem(key, "1");
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  resetQuizWarningsForTests();
  resetLessonMountRegistryForTests();
  resetLessonkitProviderStorageForTests();
  resetCourseStartedTrackingFlightForTests();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("coverage-full", () => {
  it("ThemeProvider reacts to system color scheme changes", () => {
    let matches = true;
    const listeners: Array<() => void> = [];
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        get matches() {
          return matches;
        },
        media: query,
        addEventListener: (_: string, cb: () => void) => listeners.push(cb),
        removeEventListener: vi.fn(),
      })),
    );

    function Reader() {
      const { resolvedMode } = useTheme();
      return <span data-testid="mode">{resolvedMode}</span>;
    }

    render(
      <ThemeProvider mode="system">
        <Reader />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("mode").textContent).toBe("dark");
    matches = false;
    act(() => {
      listeners[0]?.();
    });
    expect(screen.getByTestId("mode").textContent).toBe("light");
    matches = true;
    act(() => {
      listeners[0]?.();
    });
    expect(screen.getByTestId("mode").textContent).toBe("dark");
    vi.unstubAllGlobals();
  });

  it("Reflection supports controlled values without internal state updates", () => {
    function Controlled() {
      const [value, setValue] = useState("seed");
      return <Reflection prompt="Prompt" value={value} onChange={setValue} />;
    }
    render(<Controlled />);
    fireEvent.change(screen.getByLabelText("Prompt"), { target: { value: "next" } });
    expect((screen.getByLabelText("Prompt") as HTMLTextAreaElement).value).toBe("next");
  });

  it("Quiz ignores choice changes after passing", async () => {
    const events: TelemetryEvent[] = [];
    render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          tracking: { sink: (e) => { events.push(e); } },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz checkId="check-1" question="Q" choices={["A", "B"]} answer="B" />
        </Lesson>
      </Course>,
    );

    fireEvent.click(screen.getByLabelText("B"));
    await waitFor(() => expect((screen.getByLabelText("B") as HTMLInputElement).disabled).toBe(true));
    const answered = events.filter((e) => e.name === "quiz_answered").length;
    fireEvent.click(screen.getByLabelText("A"));
    expect(events.filter((e) => e.name === "quiz_answered").length).toBe(answered);
  });

  it("Quiz outside Lesson logs once in production without throwing", () => {
    vi.stubEnv("NODE_ENV", "production");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <Course title="Course" courseId="course-1">
        <Quiz checkId="check-1" question="Q" choices={["A"]} answer="A" />
      </Course>,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/must be wrapped in <Lesson>/));
    error.mockRestore();
  });

  it("Lesson cleanup skips completion when provider courseId changed", async () => {
    const events: TelemetryEvent[] = [];
    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-a",
          tracking: { sink: (e) => { events.push(e); } },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(events.some((e) => e.name === "lesson_started" && e.courseId === "course-a")).toBe(true),
    );

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-b",
          tracking: { sink: (e) => { events.push(e); } },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div>child</div>
        </Lesson>
      </LessonkitProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      events.some((e) => e.name === "lesson_completed" && e.courseId === "course-a"),
    ).toBe(false);
  });

  it("Quiz outside Lesson warns only once in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const view = render(
      <Course title="Course" courseId="course-1">
        <Quiz checkId="check-1" question="Q" choices={["A"]} answer="A" />
      </Course>,
    );
    expect(error).toHaveBeenCalledTimes(1);
    view.rerender(
      <Course title="Course" courseId="course-1">
        <Quiz checkId="check-2" question="Q2" choices={["B"]} answer="B" />
      </Course>,
    );
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });

  it("registerLessonMount keeps refcount above zero for nested mounts", () => {
    const first = registerLessonMount("lesson-1");
    registerLessonMount("lesson-1");
    first();
    expect(getLessonMountCount("lesson-1")).toBe(1);
  });

  it("courseStarted pipeline warns on non-Error extra sink failures in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      emitCourseStartedNonTrackingPipeline({
        event: {
          name: "course_started",
          timestamp: "t",
          courseId: "course-1",
          sessionId: "s1",
        },
        xapi: null,
        lxpackBridge: "off",
        extraSinks: [
          {
            id: "extra",
            emit: () => {
              throw "boom";
            },
          },
        ],
      }),
    ).rejects.toBe("boom");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('course_started extra sink "extra" failed'),
      "boom",
    );
    warn.mockRestore();
  });

  it("telemetry pipeline formats non-Error xAPI mapping failures in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(xapiMapModule, "telemetryEventToXAPIStatement").mockImplementation(() => {
      throw "mapping-string";
    });
    emitThroughPipeline(
      { name: "interaction", timestamp: "t", courseId: "c" },
      {
        tracking: { track: vi.fn() } as never,
        xapi: {
          send: vi.fn(),
          flush: async () => {},
          queueSize: () => 0,
          startedLesson: () => {},
          completeLesson: () => {},
          completeCourse: () => {},
        },
        lxpackBridge: "off",
      },
    );
    expect(warn).toHaveBeenCalledWith("[lessonkit] xAPI mapping skipped:", "mapping-string");
    warn.mockRestore();
  });

  it("provider resumes course_started tracking when session mark exists without tracking mark", async () => {
    const events: TelemetryEvent[] = [];
    const sessionId = "resume-tracking-session";
    seedStorage(`lessonkit:course_started:${sessionId}:course-1`);

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          session: { sessionId },
          tracking: { sink: (e) => { events.push(e); } },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
  });

  it("provider completes pipeline when tracking mark exists without session mark", async () => {
    const sessionId = "pipeline-only-session";
    seedStorage(`lessonkit:course_started_tracking:${sessionId}:course-1`);

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          session: { sessionId },
          tracking: { sink: () => {} },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() =>
      expect(sessionStorage.getItem(`lessonkit:course_started:${sessionId}:course-1`)).toBe("1"),
    );
    await waitFor(() =>
      expect(
        sessionStorage.getItem(`lessonkit:course_started_pipeline:${sessionId}:course-1`),
      ).toBe("1"),
    );
  });

  it("provider delivers pipeline when session and tracking marks exist without pipeline mark", async () => {
    const pipelineEvents: TelemetryEvent[] = [];
    const sessionId = "pipeline-retry-session";
    seedStorage(`lessonkit:course_started:${sessionId}:course-1`);
    seedStorage(`lessonkit:course_started_tracking:${sessionId}:course-1`);

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          session: { sessionId },
          tracking: { sink: () => {} },
          xapi: { enabled: false },
          sinks: [{ id: "extra", emit: (e) => void pipelineEvents.push(e) }],
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(pipelineEvents.some((e) => e.name === "course_started")).toBe(true));
    await waitFor(() =>
      expect(sessionStorage.getItem(`lessonkit:course_started_pipeline:${sessionId}:course-1`)).toBe(
        "1",
      ),
    );
  });

  it("provider skips duplicate setActiveLesson and completeCourse calls in v1 runtime", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { setActiveLesson } = useLessonkit();
      const { completeCourse } = useCompletion();
      React.useEffect(() => {
        setActiveLesson("lesson-1");
        setActiveLesson("lesson-1");
        completeCourse();
        completeCourse();
      }, [setActiveLesson, completeCourse]);
      return null;
    }

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          runtimeVersion: "v1",
          tracking: { sink: (e) => { events.push(e); } },
          xapi: { enabled: false },
        }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_completed")).toBe(true));
    expect(events.filter((e) => e.name === "lesson_started")).toHaveLength(1);
    expect(events.filter((e) => e.name === "course_completed")).toHaveLength(1);
  });

  it("provider ignores invalid track events without an active lesson", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { track } = useLessonkit();
      React.useEffect(() => {
        track("quiz_answered", {
          checkId: "q1",
          question: "Q",
          choice: "A",
          correct: false,
        });
      }, [track]);
      return null;
    }

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { enabled: false },
          xapi: { enabled: false },
        }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(events.filter((e) => e.name === "quiz_answered")).toHaveLength(0);
  });

  it("provider composes plugin wrappers for per-event batchSink collectors", async () => {
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

    await waitFor(() => expect(batches.some((b) => b.some((e) => e.name === "course_started"))).toBe(true));
  });

  it("provider composes plugin wrappers for direct tracking sinks", async () => {
    const events: TelemetryEvent[] = [];
    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          plugins: [
            defineTelemetryPlugin({
              id: "wrap",
              version: "1",
              kind: "analytics",
              wrapTrackingSink: (sink) => async (event) => sink(event),
            }),
          ],
          tracking: { sink: (e) => { events.push(e); } },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));
  });

  it("provider migrates dedupe marks when configured sessionId is cleared", async () => {
    const events: TelemetryEvent[] = [];
    const sessionId = "configured-session";

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          session: { sessionId },
          tracking: { sink: (e) => { events.push(e); } },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_started")).toBe(true));

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { sink: (e) => { events.push(e); } },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(events.filter((e) => e.name === "course_started")).toHaveLength(1);
  });

  it("courseStarted pipeline stays silent in production when extra sinks fail", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      emitCourseStartedNonTrackingPipeline({
        event: {
          name: "course_started",
          timestamp: "t",
          courseId: "course-1",
          sessionId: "s1",
        },
        xapi: null,
        lxpackBridge: "off",
        extraSinks: [
          {
            id: "extra",
            emit: () => {
              throw new Error("boom");
            },
          },
        ],
      }),
    ).rejects.toThrow("boom");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("provider returns filtered when plugin drops course_started on partial marks", async () => {
    const filterPlugin = defineTelemetryPlugin({
      id: "drop-started",
      version: "1",
      kind: "analytics",
      onTelemetry: (event) => (event.name === "course_started" ? null : event),
    });
    const sessionId = "filtered-pipeline-session";
    seedStorage(`lessonkit:course_started:${sessionId}:course-1`);
    seedStorage(`lessonkit:course_started_tracking:${sessionId}:course-1`);

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          session: { sessionId },
          plugins: [filterPlugin],
          tracking: { sink: () => {} },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(
      sessionStorage.getItem(`lessonkit:course_started_pipeline:${sessionId}:course-1`),
    ).toBeNull();
  });

  it("provider track returns early for invalid quiz payloads", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { track } = useLessonkit();
      React.useEffect(() => {
        track("quiz_answered", {
          checkId: "q1",
          question: "Q",
          choice: "A",
          correct: false,
        });
      }, [track]);
      return null;
    }

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { sink: (e) => { events.push(e); } },
          xapi: { enabled: false },
        }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(events.some((e) => e.name === "quiz_answered")).toBe(false);
  });

  it("does not re-emit course_started when all dedupe marks exist", async () => {
    const sessionId = "fully-settled-session";
    const events: TelemetryEvent[] = [];
    seedStorage(`lessonkit:course_started:${sessionId}:course-1`);
    seedStorage(`lessonkit:course_started_tracking:${sessionId}:course-1`);
    seedStorage(`lessonkit:course_started_pipeline:${sessionId}:course-1`);

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          session: { sessionId },
          tracking: { sink: (e) => { events.push(e); } },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(events.filter((e) => e.name === "course_started")).toHaveLength(0);
  });

  it("provider setActiveLesson skips completion when previous lesson already completed", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { setActiveLesson } = useLessonkit();
      const { completeLesson } = useCompletion();
      React.useEffect(() => {
        setActiveLesson("lesson-1");
        completeLesson("lesson-1");
        setActiveLesson("lesson-1");
        setActiveLesson("lesson-2");
      }, [setActiveLesson, completeLesson]);
      return null;
    }

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          runtimeVersion: "v1",
          tracking: { sink: (e) => { events.push(e); } },
          xapi: { enabled: false },
        }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "lesson_started" && e.lessonId === "lesson-2")).toBe(true));
    expect(events.filter((e) => e.name === "lesson_completed" && e.lessonId === "lesson-1")).toHaveLength(1);
  });

  it("provider completeCourse skips active lesson emit when already completed", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { setActiveLesson } = useLessonkit();
      const { completeLesson, completeCourse } = useCompletion();
      React.useEffect(() => {
        setActiveLesson("lesson-1");
        completeLesson("lesson-1");
        setActiveLesson("lesson-1");
        completeCourse();
      }, [setActiveLesson, completeLesson, completeCourse]);
      return null;
    }

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          runtimeVersion: "v1",
          tracking: { sink: (e) => { events.push(e); } },
          xapi: { enabled: false },
        }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.some((e) => e.name === "course_completed")).toBe(true));
    expect(events.filter((e) => e.name === "lesson_completed" && e.lessonId === "lesson-1")).toHaveLength(1);
  });

  it("provider ignores completeLesson for a mismatched courseId", async () => {
    const events: TelemetryEvent[] = [];
    function Driver() {
      const { setActiveLesson } = useLessonkit();
      const { completeLesson } = useCompletion();
      React.useEffect(() => {
        setActiveLesson("lesson-1");
        completeLesson("lesson-1", { courseId: "other-course" as "course-1" });
      }, [setActiveLesson, completeLesson]);
      return null;
    }

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          runtimeVersion: "v1",
          tracking: { sink: (e) => { events.push(e); } },
          xapi: { enabled: false },
        }}
      >
        <Driver />
      </LessonkitProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(events.some((e) => e.name === "lesson_completed")).toBe(false);
  });

  it("provider skips backup course_started emit when tracking is disabled on course change", async () => {
    const events: TelemetryEvent[] = [];
    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-a",
          tracking: { enabled: false },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div />
        </Lesson>
      </LessonkitProvider>,
    );

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-b",
          tracking: { enabled: false },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L" lessonId="lesson-1">
          <div />
        </Lesson>
      </LessonkitProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(events.filter((e) => e.name === "course_started")).toHaveLength(0);
  });
});
