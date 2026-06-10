import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { TelemetryEvent, TrackingClient } from "@lessonkit/core";
import {
  emitCourseStartedToTracking,
  emitPendingCourseStarted,
  resetCourseStartedTrackingFlightForTests,
} from "../src/provider/courseStarted/emit";
import { createSessionStoragePort } from "../src/runtime/ports";
import { hasCourseStartedEmittedToTracking } from "../src/runtime/session";

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

describe("emitPendingCourseStarted", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetCourseStartedTrackingFlightForTests();
  });

  afterEach(() => {
    resetCourseStartedTrackingFlightForTests();
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
});
