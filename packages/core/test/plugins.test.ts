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
        onTelemetry: (event) => ({
          ...event,
          data: { ...(event.data as object), tagged: true },
        }),
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
    expect((kept?.data as { tagged?: boolean })?.tagged).toBe(true);
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
