import { registerRuntimeTestCleanup } from "./runtime.testSetup";
import { describe, it, expect, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import { Course, Lesson, LessonkitProvider, ProgressTracker } from "../src";
import { defineTelemetryPlugin, type TelemetryEvent, type TelemetrySink } from "@lessonkit/core";
import * as xapiModule from "@lessonkit/xapi";
import type { XAPIStatement, XAPITransport } from "@lessonkit/xapi";
import * as courseStartedPipelineModule from "../src/runtime/courseStartedPipeline";
import { createSessionStoragePort } from "../src/runtime/ports";
import { markCourseStarted, markCourseStartedEmittedToTracking, markCourseStartedPipelineDelivered } from "../src/runtime/session";


describe("@lessonkit/react runtime — course_started", () => {
  registerRuntimeTestCleanup();

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

it("marks course_started tracking dedupe after batchSink delivery", async () => {
    let batchSinkCalled = false;
    const batchSink = async (events: TelemetryEvent[]) => {
      batchSinkCalled = true;
      expect(events.some((e) => e.name === "course_started")).toBe(true);
    };

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: {
            batchSink,
            batch: { enabled: true, flushIntervalMs: 60_000, maxBatchSize: 1 },
          },
          xapi: { enabled: false },
        }}
      >
        <div />
      </LessonkitProvider>,
    );

    await waitFor(() => expect(batchSinkCalled).toBe(true));
    await waitFor(() =>
      expect(
        Object.keys(sessionStorage).some((k) =>
          k.startsWith("lessonkit:course_started_tracking:"),
        ),
      ).toBe(true),
    );
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

it("emitCourseStarted skips storage marks when xAPI pipeline throws after tracking succeeds", async () => {
    const events: TelemetryEvent[] = [];
    const emitSpy = vi
      .spyOn(courseStartedPipelineModule, "emitCourseStartedNonTrackingPipeline")
      .mockImplementation(async () => {
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
    const emitSpy = vi
      .spyOn(courseStartedPipelineModule, "emitCourseStartedNonTrackingPipeline")
      .mockImplementation(async () => {
        if (shouldThrow) throw new Error("xapi pipeline failed");
        return { xapiStatementSent: true };
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

it("does not re-emit course_started when dedupe marks already exist for the next course", async () => {
    const events: TelemetryEvent[] = [];
    const sessionId = "course-switch-dedupe-session";

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          session: { sessionId },
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(events.filter((e) => e.name === "course_started")).toHaveLength(1));

    const storage = createSessionStoragePort();
    markCourseStarted(storage, sessionId, "course-2");
    markCourseStartedEmittedToTracking(storage, sessionId, "course-2");
    markCourseStartedPipelineDelivered(storage, sessionId, "course-2");

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-2",
          session: { sessionId },
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(events.filter((e) => e.name === "course_started")).toHaveLength(1);
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
    expect(
      Object.keys(sessionStorage).some((k) => k.startsWith("lessonkit:course_started_tracking:")),
    ).toBe(false);
  });

it("retries course_started to tracking when plugin filter is removed while tracking stays enabled", async () => {
    const filterPlugin = defineTelemetryPlugin({
      id: "filter-start",
      version: "1",
      kind: "analytics",
      onTelemetry: (event) => (event.name === "course_started" ? null : event),
    });

    const trackingEvents: TelemetryEvent[] = [];

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          plugins: [filterPlugin],
          tracking: { sink: (e) => void trackingEvents.push(e) },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    expect(trackingEvents.filter((e) => e.name === "course_started")).toHaveLength(0);

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          plugins: [],
          tracking: { sink: (e) => void trackingEvents.push(e) },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(trackingEvents.some((e) => e.name === "course_started")).toBe(true));
    expect(trackingEvents.filter((e) => e.name === "course_started")).toHaveLength(1);
  });

it("retries course_started to tracking when plugin filter is removed after xAPI bootstrap", async () => {
    const filterPlugin = defineTelemetryPlugin({
      id: "filter-start",
      version: "1",
      kind: "analytics",
      onTelemetry: (event) => (event.name === "course_started" ? null : event),
    });

    const trackingEvents: TelemetryEvent[] = [];

    const { rerender } = render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          plugins: [filterPlugin],
          tracking: { enabled: false },
          xapi: { transport: async () => {} },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    expect(
      Object.keys(sessionStorage).some((k) => k.startsWith("lessonkit:course_started:")),
    ).toBe(false);
    expect(
      Object.keys(sessionStorage).some((k) => k.startsWith("lessonkit:course_started_tracking:")),
    ).toBe(false);

    rerender(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          plugins: [],
          tracking: { sink: (e) => void trackingEvents.push(e) },
          xapi: { transport: async () => {} },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    await waitFor(() => expect(trackingEvents.some((e) => e.name === "course_started")).toBe(true));
    await waitFor(() =>
      expect(
        Object.keys(sessionStorage).some((k) => k.startsWith("lessonkit:course_started:")),
      ).toBe(true),
    );
    expect(trackingEvents.filter((e) => e.name === "course_started")).toHaveLength(1);
    expect(
      Object.keys(sessionStorage).some((k) => k.startsWith("lessonkit:course_started_tracking:")),
    ).toBe(true);
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
});

