import { describe, expect, it } from "vitest";
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
});
