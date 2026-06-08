import { describe, expect, it, vi } from "vitest";
import type { TelemetryEvent, TelemetryBatchSink } from "../src";
import { createSessionId, createTrackingClient, nowIso } from "../src";

const baseEvent = { courseId: "test-course", timestamp: "2026-01-01T00:00:00.000Z" } as const;

function interactionEvent(timestamp: string): TelemetryEvent {
  return { name: "interaction", ...baseEvent, timestamp };
}

describe("@lessonkit/core", () => {
  it("nowIso returns an ISO string", () => {
    const s = nowIso();
    expect(typeof s).toBe("string");
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("createSessionId uses crypto.randomUUID when available", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-1" });
    expect(createSessionId()).toBe("s-uuid1");
    vi.unstubAllGlobals();
  });

  it("createSessionId falls back to getRandomValues when randomUUID is missing", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (arr: Uint8Array) => {
        arr.fill(0xab);
        return arr;
      },
    });
    expect(createSessionId()).toBe(`s-${"ab".repeat(16)}`);
    vi.unstubAllGlobals();
  });

  it("createSessionId throws when Web Crypto is unavailable", () => {
    vi.stubGlobal("crypto", {});
    expect(() => createSessionId()).toThrow(/crypto\.randomUUID or crypto\.getRandomValues/);
    vi.unstubAllGlobals();
  });

  it("does not throw from track when batching is disabled and sync sink fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const sink = vi.fn(() => {
      throw new Error("sync failed");
    });
    const client = createTrackingClient({ sink, batch: { enabled: false } });
    expect(() => client.track(interactionEvent("t"))).not.toThrow();
    expect(warn).toHaveBeenCalled();
    await expect(client.deliver?.(interactionEvent("t"))).resolves.toBe(false);

    process.env.NODE_ENV = prevEnv;
    warn.mockRestore();
  });

  it("swallows async sink rejections without throwing when batching is disabled", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const sink = vi.fn(async () => {
      throw new Error("sink failed");
    });
    const client = createTrackingClient({ sink, batch: { enabled: false } });
    expect(() => client.track(interactionEvent("t"))).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("tracking sink failed"),
      "sink failed",
    );

    process.env.NODE_ENV = prevEnv;
    warn.mockRestore();
  });

  it("tracks via sink when batching is disabled", async () => {
    const sink = vi.fn(async () => {});
    const client = createTrackingClient({ sink, batch: { enabled: false } });
    const event = interactionEvent("t");
    client.track(event);
    expect(sink).toHaveBeenCalledWith(event);
  });

  it("is a safe no-op when batching enabled but no sinks provided", () => {
    const client = createTrackingClient({ batch: { enabled: true } });
    expect(() => client.track(interactionEvent("t"))).not.toThrow();
    expect(() => client.dispose?.()).not.toThrow();
  });

  it("throws when batchSink is set with batch.enabled false", () => {
    const batchSink = vi.fn(async () => {});
    expect(() =>
      createTrackingClient({
        batchSink,
        batch: { enabled: false },
      }),
    ).toThrow(/batchSink cannot be used with batch\.enabled: false/);
  });

  it("non-batched dispose stops further tracking", () => {
    const sink = vi.fn();
    const client = createTrackingClient({ sink, batch: { enabled: false } });
    client.track(interactionEvent("t1"));
    client.dispose?.();
    client.track(interactionEvent("t2"));
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it("flushes to batchSink and does not overlap in-flight flushes", async () => {
    let resolveFlush!: () => void;
    const batchSink = vi.fn(
      async () =>
        await new Promise<void>((r) => {
          resolveFlush = r;
        }),
    );

    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    client.track(interactionEvent("t1"));
    client.flush?.();
    client.flush?.();

    await Promise.resolve();
    expect(batchSink).toHaveBeenCalledTimes(1);
    resolveFlush();
    await Promise.resolve();
  });

  it("re-queues events if batchSink throws and succeeds on later flush", async () => {
    const batchSink = vi
      .fn(async (_events: TelemetryEvent[]) => {})
      .mockRejectedValueOnce(new Error("nope"))
      .mockResolvedValueOnce(undefined) as unknown as TelemetryBatchSink & {
      mockRejectedValueOnce: (err: unknown) => unknown;
      mockResolvedValueOnce: (val: unknown) => unknown;
    };

    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    client.track(interactionEvent("t1"));

    client.flush?.();
    await new Promise((r) => setTimeout(r, 0));
    expect(batchSink).toHaveBeenCalledTimes(1);

    client.flush?.();
    await new Promise((r) => setTimeout(r, 0));
    expect(batchSink).toHaveBeenCalledTimes(2);
  });

  it("batched mode uses sink when batchSink is absent", async () => {
    const sink = vi.fn(async () => {});
    const client = createTrackingClient({
      sink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });
    client.track(interactionEvent("t1"));
    client.flush?.();
    await new Promise((r) => setTimeout(r, 0));
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it("dispose clears interval when enabled", () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const client = createTrackingClient({
      sink: () => {},
      batch: { enabled: true, flushIntervalMs: 1, maxBatchSize: 100 },
    });

    expect(setIntervalSpy).toHaveBeenCalled();
    client.dispose?.();
    expect(clearIntervalSpy).toHaveBeenCalled();

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it("dispose drains tail events via repeated flush in drainAll", async () => {
    const batchSink = vi.fn<(events: TelemetryEvent[]) => Promise<void>>(async () => {
      await Promise.resolve();
    });
    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 1 },
    });

    client.track(interactionEvent("t1"));
    client.track(interactionEvent("t2"));
    await client.dispose?.();

    const totalDelivered = batchSink.mock.calls.reduce((n, call) => n + call[0].length, 0);
    expect(totalDelivered).toBe(2);
  });

  it("dispose flushes buffered events to sink", async () => {
    const sink = vi.fn(async () => {});
    const client = createTrackingClient({
      sink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    client.track(interactionEvent("t1"));
    client.track(interactionEvent("t2"));
    client.dispose?.();
    await new Promise((r) => setTimeout(r, 10));
    expect(sink).toHaveBeenCalledTimes(2);
  });

  it("track is a no-op after dispose", async () => {
    const sink = vi.fn(async () => {});
    const client = createTrackingClient({
      sink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    client.dispose?.();
    client.track(interactionEvent("t1"));
    await new Promise((r) => setTimeout(r, 0));
    expect(sink).not.toHaveBeenCalled();
  });

  it("re-queues entire batch when per-event sink fails mid-batch", async () => {
    const sink = vi
      .fn<(event: TelemetryEvent) => Promise<void>>(async () => {})
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue(undefined);

    const client = createTrackingClient({
      sink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    client.track(interactionEvent("t1"));
    client.track(interactionEvent("t2"));
    client.track(interactionEvent("t3"));

    const firstFlush = await client.flush?.();
    expect(firstFlush).toBe(false);
    await new Promise((r) => setTimeout(r, 0));

    expect(sink).toHaveBeenCalledTimes(3);
    expect(sink.mock.calls[0]?.[0]?.timestamp).toBe("t1");
    expect(sink.mock.calls[1]?.[0]?.timestamp).toBe("t2");

    const secondFlush = await client.flush?.();
    expect(secondFlush).toBe(true);
    await new Promise((r) => setTimeout(r, 0));

    expect(sink).toHaveBeenCalledTimes(6);
    expect(sink.mock.calls[5]?.[0]?.timestamp).toBe("t3");
    const redelivered = sink.mock.calls.map((call) => call[0]?.timestamp);
    expect(redelivered.filter((t) => t === "t1")).toHaveLength(2);
    expect(redelivered.filter((t) => t === "t2")).toHaveLength(2);
    expect(redelivered.filter((t) => t === "t3")).toHaveLength(2);
  });

  it("flush resolves true when sink delivers successfully", async () => {
    const batchSink = vi.fn(async () => {});
    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });
    client.track(interactionEvent("t1"));
    await expect(client.flush?.()).resolves.toBe(true);
  });

  it("dispose completes when sink permanently fails", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const batchSink = vi.fn(async () => {
      throw new Error("down");
    });
    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });
    client.track(interactionEvent("t1"));
    await expect(client.dispose?.()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    vi.unstubAllEnvs();
    warn.mockRestore();
  });

  it("refuses new events when the batch buffer is at cap", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const batchSink = vi.fn(async () => {
      throw new Error("down");
    });

    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 60_000, maxBatchSize: 10_000 },
    });

    for (let i = 0; i < 1002; i++) {
      client.track(interactionEvent(`t${i}`));
    }

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("new events are dropped");
    vi.unstubAllEnvs();
    warn.mockRestore();
  });

  it("delivers all events when tracking during a slow in-flight flush", async () => {
    let resolveFlush!: () => void;
    const batchSink = vi.fn<(events: TelemetryEvent[]) => Promise<void>>(
      () =>
        new Promise<void>((r) => {
          resolveFlush = r;
        }),
    );

    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    for (let i = 0; i < 5; i++) {
      client.track(interactionEvent(`t${i}`));
    }
    client.flush?.();
    await new Promise((r) => setTimeout(r, 0));
    client.track(interactionEvent("t5"));
    client.track(interactionEvent("t6"));

    resolveFlush();
    await new Promise((r) => setTimeout(r, 10));

    const totalDelivered = batchSink.mock.calls.reduce((n, [events]) => n + events.length, 0);
    expect(totalDelivered).toBe(7);
  });

  it("flushOnExit re-queues events when exitBatchSink promise rejects", async () => {
    const batchSink = vi.fn<TelemetryBatchSink>();
    const exitBatchSink = vi.fn(() => Promise.reject(new Error("exit fail")));
    const client = createTrackingClient({
      batchSink,
      exitBatchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    client.track(interactionEvent("exit-retry"));
    client.flushOnExit?.();
    await new Promise((r) => setTimeout(r, 0));

    await client.flush?.();
    expect(exitBatchSink).toHaveBeenCalledTimes(1);
    expect(batchSink).toHaveBeenCalledTimes(1);
  });

  it("flushOnExit re-queues events when exitBatchSink throws synchronously", async () => {
    const batchSink = vi.fn<TelemetryBatchSink>();
    const exitBatchSink = vi.fn(() => {
      throw new Error("sync exit fail");
    });
    const client = createTrackingClient({
      batchSink,
      exitBatchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    client.track(interactionEvent("exit-sync"));
    client.flushOnExit?.();
    await client.flush?.();
    expect(exitBatchSink).toHaveBeenCalledTimes(1);
    expect(batchSink).toHaveBeenCalledTimes(1);
  });

  it("flushOnExit delivers buffered events via exitBatchSink", () => {
    const exitEvents: TelemetryEvent[][] = [];
    const batchSink = vi.fn(async () => {
      throw new Error("offline");
    });
    const client = createTrackingClient({
      batchSink,
      exitBatchSink: (events) => {
        exitEvents.push([...events]);
      },
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    client.track(interactionEvent("exit-1"));
    client.flushOnExit?.();
    expect(exitEvents).toHaveLength(1);
    expect(exitEvents[0]).toHaveLength(1);
  });

  it("flushOnExit does not duplicate events owned by an in-flight batchSink delivery", async () => {
    let resolveFlush!: () => void;
    const exitEvents: TelemetryEvent[][] = [];
    const batchSink = vi.fn<TelemetryBatchSink>(
      () =>
        new Promise<void>((r) => {
          resolveFlush = r;
        }),
    );
    const client = createTrackingClient({
      batchSink,
      exitBatchSink: (events) => {
        exitEvents.push([...events]);
      },
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    client.track(interactionEvent("inflight-1"));
    client.track(interactionEvent("inflight-2"));
    void client.flush?.();
    await new Promise((r) => setTimeout(r, 0));

    client.track(interactionEvent("buffered-1"));
    client.flushOnExit?.();

    expect(exitEvents).toHaveLength(1);
    expect(exitEvents[0]?.map((e) => e.timestamp)).toEqual(["buffered-1"]);

    resolveFlush();
    await new Promise((r) => setTimeout(r, 10));
    expect(batchSink).toHaveBeenCalledTimes(1);
    const firstCall = batchSink.mock.calls[0];
    expect(firstCall).toBeDefined();
    const firstBatch = firstCall![0] as import("../src/telemetryTypes").TelemetryEvent[];
    expect(firstBatch.map((e) => e.timestamp)).toEqual([
      "inflight-1",
      "inflight-2",
    ]);
  });

  it("deliver returns false when event is dropped at buffer cap", async () => {
    const batchSink = vi.fn(async () => {
      throw new Error("down");
    });
    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 60_000, maxBatchSize: 10_000 },
    });

    for (let i = 0; i < 1000; i++) {
      client.track(interactionEvent(`t${i}`));
    }
    await expect(client.deliver?.(interactionEvent("overflow"))).resolves.toBe(false);
  });

  it("deliver dedupes course_started using production id without caller override", async () => {
    const batchSink = vi
      .fn<TelemetryBatchSink>()
      .mockRejectedValueOnce(new Error("nope"))
      .mockResolvedValueOnce(undefined);

    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    const event = {
      ...interactionEvent("course-started"),
      name: "course_started",
      sessionId: "session-1",
      courseId: "course-1",
      id: "session-1:course-1:course_started",
    } as TelemetryEvent;

    await expect(client.deliver?.(event)).resolves.toBe(false);
    await expect(client.deliver?.(event)).resolves.toBe(true);

    const lastBatch = batchSink.mock.calls.at(-1)?.[0] as TelemetryEvent[] | undefined;
    expect(lastBatch).toHaveLength(1);
    expect(lastBatch?.[0]?.id).toBe("session-1:course-1:course_started");
  });

  it("track dedupes by id while deliver flush is in-flight", async () => {
    let resolveFlush!: () => void;
    const batchSink = vi.fn<TelemetryBatchSink>(
      () =>
        new Promise<void>((resolve) => {
          resolveFlush = resolve;
        }),
    );
    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    const event = {
      ...interactionEvent("inflight-cs"),
      name: "course_started",
      sessionId: "session-1",
      courseId: "course-1",
      id: "session-1:course-1:course_started",
    } as TelemetryEvent;

    void client.deliver?.(event);
    await new Promise((r) => setTimeout(r, 0));
    expect(client.track(event)).toBe(true);

    resolveFlush();
    await client.flush?.();
    expect(batchSink).toHaveBeenCalledTimes(1);
  });

  it("track dedupes by id while track flush is in-flight", async () => {
    let resolveFlush!: () => void;
    const batchSink = vi.fn<TelemetryBatchSink>(
      () =>
        new Promise<void>((resolve) => {
          resolveFlush = resolve;
        }),
    );
    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 1 },
    });

    const event = {
      ...interactionEvent("inflight-track"),
      name: "lesson_started",
      sessionId: "session-1",
      courseId: "course-1",
      lessonId: "lesson-1",
      id: "session-1:course-1:lesson-1:lesson_started",
    } as TelemetryEvent;

    expect(client.track(event)).toBe(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(client.track(event)).toBe(true);

    resolveFlush();
    await client.flush?.();
    expect(batchSink).toHaveBeenCalledTimes(1);
    expect((batchSink.mock.calls[0]?.[0] as TelemetryEvent[]).length).toBe(1);
  });

  it("deliver does not double-enqueue when flush fails and deliver is retried", async () => {
    const batchSink = vi
      .fn<TelemetryBatchSink>()
      .mockRejectedValueOnce(new Error("nope"))
      .mockResolvedValueOnce(undefined);

    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    const event = {
      ...interactionEvent("course-started"),
      id: "evt-course-started",
      name: "course_started",
    } as TelemetryEvent;

    await expect(client.deliver?.(event)).resolves.toBe(false);
    await expect(client.deliver?.(event)).resolves.toBe(true);

    const lastBatch = batchSink.mock.calls.at(-1)?.[0] as TelemetryEvent[] | undefined;
    expect(lastBatch).toHaveLength(1);
    expect(lastBatch?.[0]?.id).toBe("evt-course-started");
  });

  it("dedupes buffered events by id", async () => {
    const batchSink = vi.fn<TelemetryBatchSink>();
    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    const event = {
      ...interactionEvent("dup"),
      id: "evt-dup",
      name: "interaction",
    } as TelemetryEvent;

    client.track(event);
    client.track({ ...event, timestamp: "dup-2" });
    await client.flush?.();

    expect(batchSink).toHaveBeenCalledTimes(1);
    const firstBatch = batchSink.mock.calls[0]?.[0];
    expect(firstBatch).toHaveLength(1);
    expect(firstBatch?.[0]?.id).toBe("evt-dup");
  });

  it("dispose calls onBufferDrop for each event dropped after flush cap", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const onBufferDrop = vi.fn();
    const batchSink = vi.fn(async () => {
      throw new Error("down");
    });
    const client = createTrackingClient({
      batchSink,
      onBufferDrop,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    client.track(interactionEvent("t1"));
    await client.dispose?.();
    expect(onBufferDrop).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });
});

