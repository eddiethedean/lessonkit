import { describe, expect, it, vi } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import { createTelemetryPipeline, createTrackingPipelineSink } from "../src/telemetryPipeline";

describe("createTelemetryPipeline", () => {
  it("invokes all sinks in registration order", () => {
    const order: string[] = [];
    const pipeline = createTelemetryPipeline([
      createTrackingPipelineSink("a", () => void order.push("a")),
      { id: "b", emit: () => void order.push("b") },
    ]);

    const event: TelemetryEvent = {
      name: "course_started",
      timestamp: "t",
      courseId: "c",
      sessionId: "s",
    };
    pipeline.emit(event);

    expect(order).toEqual(["a", "b"]);
  });

  it("passes emit context derived from event when omitted", () => {
    const ctxs: string[] = [];
    const pipeline = createTelemetryPipeline([
      {
        id: "ctx",
        emit(_event, ctx) {
          ctxs.push(ctx.courseId);
        },
      },
    ]);

    pipeline.emit({
      name: "course_started",
      timestamp: "t",
      courseId: "course-1",
      sessionId: "s",
    });

    expect(ctxs).toEqual(["course-1"]);
  });

  it("createTrackingPipelineSink forwards events to track fn", () => {
    const tracked: string[] = [];
    const sink = createTrackingPipelineSink("t", (event) => tracked.push(event.name));
    sink.emit(
      {
        name: "course_completed",
        timestamp: "t",
        courseId: "c",
        sessionId: "s",
      },
      { courseId: "c", sessionId: "s" },
    );
    expect(tracked).toEqual(["course_completed"]);
  });

  it("swallows sync sink throws and still invokes later sinks", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const order: string[] = [];

    const pipeline = createTelemetryPipeline([
      {
        id: "sync-fail",
        emit: () => {
          throw new Error("sync sink failed");
        },
      },
      { id: "after", emit: () => void order.push("after") },
    ]);

    expect(() =>
      pipeline.emit({
        name: "course_started",
        timestamp: "t",
        courseId: "c",
        sessionId: "s",
      }),
    ).not.toThrow();

    expect(order).toEqual(["after"]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('telemetry sink "sync-fail" failed'),
      "sync sink failed",
    );

    process.env.NODE_ENV = prevEnv;
    warn.mockRestore();
  });

  it("swallows async sink rejections without throwing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const pipeline = createTelemetryPipeline([
      {
        id: "async-fail",
        emit: async () => {
          throw new Error("sink failed");
        },
      },
    ]);

    expect(() =>
      pipeline.emit({
        name: "course_started",
        timestamp: "t",
        courseId: "c",
        sessionId: "s",
      }),
    ).not.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('telemetry sink "async-fail" failed'),
      "sink failed",
    );

    process.env.NODE_ENV = prevEnv;
    warn.mockRestore();
  });
});
