import { registerRuntimeTestCleanup } from "./runtime.testSetup";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import type { TrackingClient } from "@lessonkit/core";
import { act, render, waitFor } from "@testing-library/react";
import { Course, Lesson, LessonkitProvider, ProgressTracker } from "../src";
import { defineTelemetryPlugin, type TelemetryEvent, type TelemetrySink } from "@lessonkit/core";
import * as xapiModule from "@lessonkit/xapi";
import type { XAPIStatement, XAPITransport } from "@lessonkit/xapi";
import * as courseStartedPipelineModule from "../src/runtime/courseStartedPipeline";
import { createSessionStoragePort } from "../src/runtime/ports";
import {
  hasCourseStartedPipelineDelivered,
  markCourseStarted,
  markCourseStartedEmittedToTracking,
  markCourseStartedPipelineDelivered,
} from "../src/runtime/session";
import {
  buildCourseStartedEvent,
  isCourseStartedSinkSettled,
  isTrackingActive,
} from "../src/provider/courseStarted";
import {
  emitCourseStartedPipelineOnly,
  emitCourseStartedToTracking,
  emitPendingCourseStarted,
  resetCourseStartedTrackingFlightForTests,
} from "../src/provider/courseStarted/emit";
import { emitCourseStartedNonTrackingPipeline } from "../src/runtime/courseStartedPipeline";
import { hasCourseStartedEmittedToTracking } from "../src/runtime/session";


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
    await waitFor(() =>
      expect(pipelineEvents.filter((e) => e.name === "course_started")).toHaveLength(1),
    );
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

describe("courseStarted helpers", () => {
  it("isTrackingActive defaults to true", () => {
    expect(isTrackingActive(undefined)).toBe(true);
    expect(isTrackingActive({ enabled: false })).toBe(false);
  });

  it("isCourseStartedSinkSettled is true only for emitted", () => {
    expect(isCourseStartedSinkSettled("emitted")).toBe(true);
    expect(isCourseStartedSinkSettled("filtered")).toBe(false);
    expect(isCourseStartedSinkSettled("failed")).toBe(false);
  });

  it("buildCourseStartedEvent returns course_started payload", () => {
    const event = buildCourseStartedEvent({
      pluginHost: null,
      courseId: "course-1",
      sessionId: "session-1",
      lxpackBridge: "auto",
    });
    expect(event?.name).toBe("course_started");
    expect(event?.courseId).toBe("course-1");
  });

  it("buildCourseStartedEvent includes session metadata when provided", () => {
    const event = buildCourseStartedEvent({
      pluginHost: null,
      courseId: "course-1",
      sessionId: "session-42",
      lxpackBridge: "auto",
    });
    expect(event?.sessionId).toBe("session-42");
    expect(event?.name).toBe("course_started");
    expect(event?.courseId).toBe("course-1");
  });

  it("buildCourseStartedEvent assigns a stable dedupe id", () => {
    const event = buildCourseStartedEvent({
      pluginHost: null,
      courseId: "course-1",
      sessionId: "session-42",
      lxpackBridge: "auto",
    });
    expect(event?.id).toBe("session-42:course-1:course_started");
  });
});

describe("emitCourseStartedToTracking", () => {
  const event: TelemetryEvent = {
    name: "course_started",
    timestamp: "2026-01-01T00:00:00Z",
    courseId: "course-1",
  };

  beforeEach(() => {
    sessionStorage.clear();
    resetCourseStartedTrackingFlightForTests();
  });

  afterEach(() => {
    resetCourseStartedTrackingFlightForTests();
  });

  it("marks dedupe only after successful flush", async () => {
    const storage = createSessionStoragePort();
    const tracking: TrackingClient = {
      track: vi.fn(),
      flush: vi.fn(async () => false),
    };

    const ok = await emitCourseStartedToTracking(
      tracking,
      storage,
      "session-1",
      "course-1",
      event,
    );

    expect(ok).toBe(false);
    expect(hasCourseStartedEmittedToTracking(storage, "session-1", "course-1")).toBe(false);
  });

  it("does not mark dedupe when deliver returns false for non-batch client", async () => {
    const storage = createSessionStoragePort();
    const tracking: TrackingClient = {
      deliver: async () => false,
      track: vi.fn(),
    };

    const ok = await emitCourseStartedToTracking(
      tracking,
      storage,
      "session-1",
      "course-1",
      event,
    );

    expect(ok).toBe(false);
    expect(hasCourseStartedEmittedToTracking(storage, "session-1", "course-1")).toBe(false);
  });

  it("does not mark dedupe when track returns false for sync client without flush", async () => {
    const storage = createSessionStoragePort();
    const tracking: TrackingClient = {
      track: vi.fn(() => false),
    };

    const ok = await emitCourseStartedToTracking(
      tracking,
      storage,
      "session-1",
      "course-1",
      event,
    );

    expect(ok).toBe(false);
    expect(hasCourseStartedEmittedToTracking(storage, "session-1", "course-1")).toBe(false);
  });

  it("dedupes concurrent tracking retries after failed deliver", async () => {
    const storage = createSessionStoragePort();
    let deliverCalls = 0;
    const tracking: TrackingClient = {
      deliver: async () => {
        deliverCalls += 1;
        return deliverCalls >= 2;
      },
      track: vi.fn(),
    };

    const [a, b] = await Promise.all([
      emitCourseStartedToTracking(tracking, storage, "session-1", "course-1", event),
      emitCourseStartedToTracking(tracking, storage, "session-1", "course-1", event),
    ]);

    expect(a).toBe(b);
    expect(deliverCalls).toBe(1);
  });

  it("marks dedupe after sync track when client has no deliver or flush", async () => {
    const storage = createSessionStoragePort();
    const tracking: TrackingClient = {
      track: vi.fn(),
    };

    const ok = await emitCourseStartedToTracking(
      tracking,
      storage,
      "session-1",
      "course-1",
      event,
    );

    expect(ok).toBe(true);
    expect(tracking.track).toHaveBeenCalledWith(event);
    expect(hasCourseStartedEmittedToTracking(storage, "session-1", "course-1")).toBe(true);
  });

  it("marks dedupe after flush resolves void", async () => {
    const storage = createSessionStoragePort();
    const tracking: TrackingClient = {
      track: vi.fn(),
      flush: vi.fn(() => {}),
    };

    const ok = await emitCourseStartedToTracking(
      tracking,
      storage,
      "session-1",
      "course-1",
      event,
    );

    expect(ok).toBe(true);
    expect(hasCourseStartedEmittedToTracking(storage, "session-1", "course-1")).toBe(true);
  });

  it("marks dedupe after flush succeeds", async () => {
    const storage = createSessionStoragePort();
    const tracking: TrackingClient = {
      track: vi.fn(),
      flush: vi.fn(async () => true),
    };

    const ok = await emitCourseStartedToTracking(
      tracking,
      storage,
      "session-1",
      "course-1",
      event,
    );

    expect(ok).toBe(true);
    expect(hasCourseStartedEmittedToTracking(storage, "session-1", "course-1")).toBe(true);
  });

  it("treats delivery as success when durable mark fails but in-memory dedupe is set", async () => {
    const memory = new Map<string, string>();
    const storage = {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memory.set(k, v);
        return false;
      },
    };
    const tracking: TrackingClient = {
      deliver: async () => true,
      track: vi.fn(),
    };

    const ok = await emitCourseStartedToTracking(
      tracking,
      storage,
      "session-1",
      "course-1",
      event,
    );

    expect(ok).toBe(true);
    expect(hasCourseStartedEmittedToTracking(storage, "session-1", "course-1")).toBe(true);
  });

  it("does not mark dedupe when shouldCommit fails after flush", async () => {
    const storage = createSessionStoragePort();
    let commit = true;
    const tracking: TrackingClient = {
      track: vi.fn(),
      flush: vi.fn(async () => {
        commit = false;
        return true;
      }),
    };

    const ok = await emitCourseStartedToTracking(
      tracking,
      storage,
      "session-1",
      "course-1",
      event,
      () => commit,
    );

    expect(ok).toBe(false);
    expect(hasCourseStartedEmittedToTracking(storage, "session-1", "course-1")).toBe(false);
  });
});

describe("emitCourseStartedPipelineOnly", () => {
  const courseStartedEvent: TelemetryEvent = {
    name: "course_started",
    timestamp: "2020-01-01T00:00:00Z",
    courseId: "course-1",
    sessionId: "session-1",
  };

  function mockXapi() {
    return {
      send: vi.fn(),
      flush: vi.fn(async () => {}),
      queueSize: () => 0,
      startedLesson: () => {},
      completeLesson: () => {},
      completeCourse: () => {},
    };
  }

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("does not mark pipeline delivered when xAPI mapping returns null", async () => {
    vi.spyOn(xapiModule, "telemetryEventToXAPIStatement").mockReturnValue(null);
    const storage = createSessionStoragePort();
    const result = await emitCourseStartedPipelineOnly({
      pluginHost: null,
      sessionId: "session-1",
      courseId: "course-1",
      lxpackBridge: "off",
      storage,
      event: courseStartedEvent,
      xapi: mockXapi(),
    });
    expect(result).toBe("failed");
    expect(hasCourseStartedPipelineDelivered(storage, "session-1", "course-1")).toBe(false);
    vi.restoreAllMocks();
  });
});

describe("emitPendingCourseStarted", () => {
  function mockXapi() {
    return {
      send: vi.fn(),
      flush: vi.fn(async () => {}),
      queueSize: () => 0,
      startedLesson: () => {},
      completeLesson: () => {},
      completeCourse: () => {},
    };
  }

  beforeEach(() => {
    sessionStorage.clear();
    resetCourseStartedTrackingFlightForTests();
  });

  afterEach(() => {
    resetCourseStartedTrackingFlightForTests();
    vi.restoreAllMocks();
  });

  it("dedupes concurrent emit calls for the same session and course", async () => {
    const storage = createSessionStoragePort();
    let trackCalls = 0;
    const tracking: TrackingClient = {
      track: () => {
        trackCalls += 1;
        return true;
      },
      flush: async () => true,
    };
    const baseOpts = {
      pluginHost: null,
      sessionId: "session-1",
      courseId: "course-1" as const,
      lxpackBridge: "off" as const,
      tracking,
      xapi: mockXapi(),
      storage,
    };

    const [a, b] = await Promise.all([
      emitPendingCourseStarted(baseOpts),
      emitPendingCourseStarted(baseOpts),
    ]);

    expect(a).toBe(b);
    expect(trackCalls).toBe(1);
  });

  it("retries xAPI delivery after mapping failure", async () => {
    const storage = createSessionStoragePort();
    const tracking: TrackingClient = {
      track: () => true,
      flush: async () => true,
    };
    const send = vi.fn();
    const validStatement = {
      id: "stmt-1",
      timestamp: "2020-01-01T00:00:00Z",
      actor: { objectType: "Agent", name: "Learner" },
      verb: { id: "http://adlnet.gov/expapi/verbs/initialized", display: { "en-US": "initialized" } },
      object: { id: "https://example.com/course-1", objectType: "Activity" },
    } as unknown as XAPIStatement;
    const mapSpy = vi.spyOn(xapiModule, "telemetryEventToXAPIStatement").mockReturnValue(null);

    const baseOpts = {
      pluginHost: null,
      sessionId: "session-1",
      courseId: "course-1" as const,
      lxpackBridge: "off" as const,
      tracking,
      xapi: { ...mockXapi(), send },
      storage,
    };

    const first = await emitPendingCourseStarted(baseOpts);
    expect(first).toBe("failed");
    expect(hasCourseStartedPipelineDelivered(storage, "session-1", "course-1")).toBe(false);
    expect(send).not.toHaveBeenCalled();

    mapSpy.mockReturnValue(validStatement);
    const second = await emitPendingCourseStarted(baseOpts);
    expect(second).toBe("emitted");
    expect(send).toHaveBeenCalledTimes(1);
    expect(hasCourseStartedPipelineDelivered(storage, "session-1", "course-1")).toBe(true);
    mapSpy.mockRestore();
  });
});

describe("emitCourseStartedNonTrackingPipeline", () => {
  const courseStartedEvent: TelemetryEvent = {
    name: "course_started",
    timestamp: "2020-01-01T00:00:00Z",
    courseId: "course-1",
    sessionId: "session-1",
  };

  function mockXapiClient(send = vi.fn()): import("@lessonkit/xapi").XAPIClient {
    return {
      send,
      flush: async () => {},
      queueSize: () => 0,
      startedLesson: () => {},
      completeLesson: () => {},
      completeCourse: () => {},
    };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends xAPI, awaits flush, and reports xapiStatementSent", async () => {
    const send = vi.fn();
    const flush = vi.fn(async () => {});
    const result = await emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: { ...mockXapiClient(send), flush },
      lxpackBridge: "off",
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledTimes(1);
    expect(result.xapiStatementSent).toBe(true);
  });

  it("does not report xapiStatementSent when flush fails", async () => {
    const send = vi.fn();
    const flush = vi.fn(async () => {
      throw new Error("flush failed");
    });
    await expect(
      emitCourseStartedNonTrackingPipeline({
        event: courseStartedEvent,
        xapi: { ...mockXapiClient(send), flush },
        lxpackBridge: "off",
      }),
    ).rejects.toThrow("flush failed");
  });

  it("skips xAPI when skipXapi is true", async () => {
    const send = vi.fn();
    const result = await emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: mockXapiClient(send),
      lxpackBridge: "off",
      skipXapi: true,
    });
    expect(send).not.toHaveBeenCalled();
    expect(result.xapiStatementSent).toBe(false);
  });

  it("skips xAPI when client is null", async () => {
    const result = await emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: null,
      lxpackBridge: "off",
    });
    expect(result.xapiStatementSent).toBe(false);
  });

  it("invokes onXapiMappingError when mapping throws", async () => {
    const onXapiMappingError = vi.fn();
    vi.spyOn(xapiModule, "telemetryEventToXAPIStatement").mockImplementation(() => {
      throw new Error("mapping failed");
    });
    const result = await emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: mockXapiClient(vi.fn()),
      lxpackBridge: "off",
      onXapiMappingError,
    });
    expect(onXapiMappingError).toHaveBeenCalledWith(expect.any(Error));
    expect(result.xapiStatementSent).toBe(false);
  });

  it("does not send when mapping returns no statement", async () => {
    const send = vi.fn();
    vi.spyOn(xapiModule, "telemetryEventToXAPIStatement").mockReturnValue(null);
    const result = await emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: mockXapiClient(send),
      lxpackBridge: "off",
    });
    expect(send).not.toHaveBeenCalled();
    expect(result.xapiStatementSent).toBe(false);
  });

  it("forwards to extraSinks", async () => {
    const extra: TelemetryEvent[] = [];
    await emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: null,
      lxpackBridge: "off",
      extraSinks: [{ id: "extra", emit: (e) => void extra.push(e) }],
    });
    expect(extra).toHaveLength(1);
    expect(extra[0]?.name).toBe("course_started");
  });

  it("propagates async extraSink rejections", async () => {
    await expect(
      emitCourseStartedNonTrackingPipeline({
        event: courseStartedEvent,
        xapi: null,
        lxpackBridge: "off",
        extraSinks: [
          {
            id: "failing",
            emit: async () => {
              throw new Error("sink failed");
            },
          },
        ],
      }),
    ).rejects.toThrow("sink failed");
  });

  it("awaits async extraSinks before returning", async () => {
    let settled = false;
    await emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: null,
      lxpackBridge: "off",
      extraSinks: [
        {
          id: "slow",
          emit: async () => {
            await new Promise((r) => setTimeout(r, 10));
            settled = true;
          },
        },
      ],
    });
    expect(settled).toBe(true);
  });

  it("calls onBeforeExtraSinks after xAPI and lxpack before extra sinks", async () => {
    const order: string[] = [];
    const flush = vi.fn(async () => {
      order.push("flush");
    });
    await emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: { ...mockXapiClient(vi.fn()), flush },
      lxpackBridge: "off",
      onBeforeExtraSinks: () => {
        order.push("before-extra");
      },
      extraSinks: [
        {
          id: "extra",
          emit: () => {
            order.push("extra");
          },
        },
      ],
    });
    expect(order).toEqual(["flush", "before-extra", "extra"]);
  });

  it("commits onBeforeExtraSinks before extra sinks even when a sink fails", async () => {
    const marks: string[] = [];
    await emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: null,
      lxpackBridge: "off",
      onBeforeExtraSinks: () => {
        marks.push("before-extra");
      },
      extraSinks: [
        {
          id: "failing",
          emit: async () => {
            throw new Error("sink failed");
          },
        },
      ],
    }).catch(() => undefined);

    expect(marks).toEqual(["before-extra"]);
  });

  it("calls onXapiDelivered after flush before extra sinks", async () => {
    const order: string[] = [];
    const flush = vi.fn(async () => {
      order.push("flush");
    });
    await emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: { ...mockXapiClient(vi.fn()), flush },
      lxpackBridge: "off",
      onXapiDelivered: () => order.push("xapi-delivered"),
      extraSinks: [
        {
          id: "extra",
          emit: () => {
            order.push("extra");
          },
        },
      ],
    });
    expect(order).toEqual(["flush", "xapi-delivered", "extra"]);
  });

  it("uses stable xAPI statement ids when course_started is retried with a new timestamp", async () => {
    const ids: string[] = [];
    const send = vi.fn((statement: { id: string }) => {
      ids.push(statement.id);
    });
    const xapi = { ...mockXapiClient(send), flush: vi.fn(async () => {}) };
    await emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi,
      lxpackBridge: "off",
    });
    await emitCourseStartedNonTrackingPipeline({
      event: { ...courseStartedEvent, timestamp: "2026-06-07T12:00:00.000Z" },
      xapi,
      lxpackBridge: "off",
    });
    expect(ids.length).toBe(2);
    expect(ids[0]).toBe(ids[1]);
  });
});

