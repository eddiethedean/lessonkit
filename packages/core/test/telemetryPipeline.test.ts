import { describe, expect, it, vi } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import { createTelemetryPipeline, createTrackingPipelineSink } from "@lessonkit/core";

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
});
