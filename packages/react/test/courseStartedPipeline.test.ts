import { describe, expect, it, vi, afterEach } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import * as xapiModule from "@lessonkit/xapi";
import { emitCourseStartedNonTrackingPipeline } from "../src/runtime/courseStartedPipeline";

const courseStartedEvent: TelemetryEvent = {
  name: "course_started",
  timestamp: "2020-01-01T00:00:00Z",
  courseId: "course-1",
  sessionId: "session-1",
};

function mockXapiClient(send = vi.fn()): XAPIClient {
  return {
    send,
    flush: async () => {},
    queueSize: () => 0,
    startedLesson: () => {},
    completeLesson: () => {},
    completeCourse: () => {},
  };
}

describe("emitCourseStartedNonTrackingPipeline", () => {
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
});
