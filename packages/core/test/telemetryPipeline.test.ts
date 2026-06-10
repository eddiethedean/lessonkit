import { describe, expect, it, vi } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import {
  createTelemetryPipeline,
  createTrackingPipelineSink,
  isLifecycleTelemetryEvent,
} from "../src/telemetryPipeline";

describe("createTelemetryPipeline", () => {
  it("invokes all sinks in registration order", async () => {
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
    await pipeline.emit(event);

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

  it("swallows sync sink throws and still invokes later sinks", async () => {
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

    await expect(
      pipeline.emit({
        name: "course_started",
        timestamp: "t",
        courseId: "c",
        sessionId: "s",
      }),
    ).resolves.toBeUndefined();

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

    await expect(
      pipeline.emit({
        name: "course_started",
        timestamp: "t",
        courseId: "c",
        sessionId: "s",
      }),
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('telemetry sink "async-fail" failed'),
      "sink failed",
    );

    process.env.NODE_ENV = prevEnv;
    warn.mockRestore();
  });

  it("isLifecycleTelemetryEvent identifies course and lesson lifecycle names", () => {
    expect(isLifecycleTelemetryEvent("lesson_started")).toBe(true);
    expect(isLifecycleTelemetryEvent("interaction")).toBe(false);
  });

  it("warns on non-Error sink failures in development but stays silent in production", () => {
    const event = {
      name: "course_started" as const,
      timestamp: "t",
      courseId: "c" as const,
      sessionId: "s",
    };

    vi.stubEnv("NODE_ENV", "development");
    const devWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const devPipeline = createTelemetryPipeline([
      {
        id: "fail",
        emit: () => {
          throw "string-failure";
        },
      },
    ]);
    devPipeline.emit(event);
    expect(devWarn).toHaveBeenCalledWith(
      expect.stringContaining('telemetry sink "fail" failed'),
      "string-failure",
    );
    devWarn.mockRestore();

    vi.stubEnv("NODE_ENV", "production");
    const prodWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const prodPipeline = createTelemetryPipeline([
      {
        id: "fail",
        emit: () => {
          throw "string-failure";
        },
      },
    ]);
    expect(() => prodPipeline.emit(event)).not.toThrow();
    expect(prodWarn).not.toHaveBeenCalled();
    prodWarn.mockRestore();
    vi.unstubAllEnvs();
  });

  it("awaits async sinks in registration order", async () => {
    const order: string[] = [];
    const pipeline = createTelemetryPipeline([
      {
        id: "async-a",
        emit: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          order.push("a");
        },
      },
      {
        id: "async-b",
        emit: async () => {
          order.push("b");
        },
      },
    ]);

    await pipeline.emit({
      name: "course_started",
      timestamp: "t",
      courseId: "c",
      sessionId: "s",
    });

    expect(order).toEqual(["a", "b"]);
  });
});
