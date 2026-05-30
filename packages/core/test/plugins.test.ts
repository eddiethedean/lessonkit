import { describe, expect, it, vi } from "vitest";
import {
  createPluginHost,
  defineLessonkitPlugin,
  type LessonkitPlugin,
  type TelemetryEvent,
} from "../src";

const ctx = { courseId: "course-1" as const, sessionId: "sess-1" };
const baseEvent = {
  name: "interaction" as const,
  courseId: "course-1" as const,
  timestamp: "2026-01-01T00:00:00.000Z",
};

describe("createPluginHost", () => {
  it("runs setup and dispose in order", () => {
    const order: string[] = [];
    const a: LessonkitPlugin = {
      id: "a",
      version: "1",
      kind: "analytics",
      setup: () => order.push("setup:a"),
      dispose: () => order.push("dispose:a"),
    };
    const b: LessonkitPlugin = {
      id: "b",
      version: "1",
      kind: "analytics",
      setup: () => order.push("setup:b"),
      dispose: () => order.push("dispose:b"),
    };
    const host = createPluginHost([a, b]);
    host.setupAll(ctx);
    host.disposeAll();
    expect(order).toEqual(["setup:a", "setup:b", "dispose:b", "dispose:a"]);
  });

  it("chains onTelemetry and can drop events", () => {
    const host = createPluginHost([
      defineLessonkitPlugin({
        id: "tag",
        version: "1",
        kind: "analytics",
        onTelemetry: (event) => {
          if (event.name !== "interaction") return event;
          return {
            ...event,
            data: { ...(event.data ?? {}), tagged: true },
          };
        },
      }),
      defineLessonkitPlugin({
        id: "drop-interaction",
        version: "1",
        kind: "analytics",
        onTelemetry: (event) => (event.name === "interaction" ? null : event),
      }),
    ]);

    const tagged = host.runTelemetry(baseEvent, ctx);
    expect(tagged).toBeNull();

    const kept = host.runTelemetry(
      { ...baseEvent, name: "course_started" },
      ctx,
    );
    expect(kept?.name).toBe("course_started");
    expect((kept?.data as { tagged?: boolean } | undefined)?.tagged).toBeUndefined();
  });

  it("composes wrapTrackingSink inside-out by registration order", async () => {
    const host = createPluginHost([
      defineLessonkitPlugin({
        id: "outer",
        version: "1",
        kind: "analytics",
        wrapTrackingSink: (sink) => async (event) => {
          await sink({ ...event, sessionId: `${event.sessionId ?? ""}-outer` });
        },
      }),
      defineLessonkitPlugin({
        id: "inner",
        version: "1",
        kind: "analytics",
        wrapTrackingSink: (sink) => async (event) => {
          await sink({ ...event, sessionId: `${event.sessionId ?? ""}-inner` });
        },
      }),
    ]);

    const sink = vi.fn(async () => {});
    const wrapped = host.composeTrackingSink(sink, ctx)!;
    await wrapped({ ...baseEvent, sessionId: "s" });

    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "s-inner-outer" }),
    );
  });

  it("preserves stateful wrapTrackingSink across events with stable context", async () => {
    let callCount = 0;
    const host = createPluginHost([
      defineLessonkitPlugin({
        id: "counter",
        version: "1",
        kind: "analytics",
        wrapTrackingSink: (sink) => async (event) => {
          callCount += 1;
          await sink(event);
        },
      }),
    ]);

    const sink = vi.fn(async () => {});
    const wrapped = host.composeTrackingSink(sink, ctx)!;
    await wrapped(baseEvent);
    await wrapped(baseEvent);

    expect(callCount).toBe(2);
    expect(sink).toHaveBeenCalledTimes(2);
  });

  it("recomposes wrapTrackingSink when context getter returns new courseId", async () => {
    const ctxCourseIds: string[] = [];
    let currentCourseId = "course-a";
    const host = createPluginHost([
      defineLessonkitPlugin({
        id: "ctx-track",
        version: "1",
        kind: "analytics",
        wrapTrackingSink: (sink, pluginCtx) => (event) => {
          ctxCourseIds.push(pluginCtx.courseId);
          return sink(event);
        },
      }),
    ]);

    const sink = vi.fn(async () => {});
    const wrapped = host.composeTrackingSink(sink, () => ({
      courseId: currentCourseId,
    }))!;
    await wrapped(baseEvent);
    currentCourseId = "course-b";
    await wrapped(baseEvent);

    expect(ctxCourseIds).toEqual(["course-a", "course-b"]);
  });

  it("warns on duplicate plugin ids in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
    try {
      createPluginHost([
        { id: "dup", version: "1", kind: "analytics" },
        { id: "dup", version: "2", kind: "analytics" },
      ]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("dup"));
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

  it("deliverTelemetryBatch runs only batch hooks without re-filtering", () => {
    const seen: TelemetryEvent[] = [];
    const host = createPluginHost([
      defineLessonkitPlugin({
        id: "once",
        version: "1",
        kind: "analytics",
        onTelemetry: (event) => (seen.includes(event) ? null : (seen.push(event), event)),
        onTelemetryBatch: (events) => {
          expect(events).toHaveLength(1);
        },
      }),
    ]);
    const events = [baseEvent];
    host.runTelemetry(events[0]!, ctx);
    const delivered = host.deliverTelemetryBatch(events, ctx);
    expect(delivered).toHaveLength(1);
    expect(seen).toHaveLength(1);
  });

  it("runs onTelemetryBatch after filtering", () => {
    const batch = vi.fn();
    const host = createPluginHost([
      defineLessonkitPlugin({
        id: "batch",
        version: "1",
        kind: "analytics",
        onTelemetryBatch: batch,
      }),
    ]);
    const events = [baseEvent, { ...baseEvent, name: "course_started" as const }];
    const filtered = host.runTelemetryBatch(events, ctx);
    expect(filtered).toHaveLength(2);
    expect(batch).toHaveBeenCalledWith(filtered, ctx);
  });

  it("scoreAssessment returns null when no assessment plugin matches", () => {
    const host = createPluginHost([
      defineLessonkitPlugin({ id: "a", version: "1", kind: "analytics" }),
    ]);
    expect(host.scoreAssessment({ checkId: "q1", response: "x" }, ctx)).toBeNull();
  });

  it("scoreAssessment returns first assessment plugin result", () => {
    const host = createPluginHost([
      defineLessonkitPlugin({
        id: "noop",
        version: "1",
        kind: "analytics",
        scoreAssessment: () => null,
      }),
      defineLessonkitPlugin({
        id: "scorer",
        version: "1",
        kind: "assessment",
        scoreAssessment: () => ({ score: 1, maxScore: 1, passed: true }),
      }),
    ]);

    expect(host.scoreAssessment({ checkId: "q1", response: "x" }, ctx)).toEqual({
      score: 1,
      maxScore: 1,
      passed: true,
    });
  });
});
