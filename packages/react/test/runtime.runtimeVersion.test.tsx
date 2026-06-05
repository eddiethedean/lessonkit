import React, { useState } from "react";
import { registerRuntimeTestCleanup } from "./runtime.testSetup";
import { describe, it, expect } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Lesson, LessonkitProvider, useLessonkit } from "../src";
import { type TelemetryEvent } from "@lessonkit/core";


describe("@lessonkit/react runtime — runtimeVersion", () => {
  registerRuntimeTestCleanup();

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
});

