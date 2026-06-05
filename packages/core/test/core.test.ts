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
    expect(createSessionId()).toBe("uuid-1");
    vi.unstubAllGlobals();
  });

  it("createSessionId falls back when crypto.randomUUID is missing", () => {
    vi.stubGlobal("crypto", {});
    const id = createSessionId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });

  it("rethrows sync sink errors when batching is disabled", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const sink = vi.fn(() => {
      throw new Error("sync failed");
    });
    const client = createTrackingClient({ sink, batch: { enabled: false } });
    expect(() => client.track(interactionEvent("t"))).toThrow("sync failed");
    expect(warn).toHaveBeenCalled();

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
    client.track(interactionEvent("t"));
    expect(sink).toHaveBeenCalledTimes(1);
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

  it("re-queues the full batch when per-event sink fails mid-batch (at-most-once per-event caveat)", async () => {
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

    await client.flush?.();
    await new Promise((r) => setTimeout(r, 0));

    expect(sink).toHaveBeenCalledTimes(3);
    expect(sink.mock.calls[0]?.[0]?.timestamp).toBe("t1");
    expect(sink.mock.calls[1]?.[0]?.timestamp).toBe("t2");

    await client.flush?.();
    await new Promise((r) => setTimeout(r, 0));

    expect(sink.mock.calls.length).toBeGreaterThanOrEqual(5);
    const redelivered = sink.mock.calls.slice(3).map((call) => call[0]?.timestamp);
    expect(redelivered).toContain("t1");
    expect(redelivered).toContain("t2");
    expect(redelivered).toContain("t3");
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
});

