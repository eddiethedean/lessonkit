import { describe, expect, it, vi } from "vitest";
import { createSessionId, createTrackingClient, nowIso } from "../src";

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

  it("tracks via sink when batching is disabled", async () => {
    const sink = vi.fn(async () => {});
    const client = createTrackingClient({ sink, batch: { enabled: false } });
    client.track({ name: "interaction", timestamp: "t" });
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it("is a safe no-op when batching enabled but no sinks provided", () => {
    const client = createTrackingClient({ batch: { enabled: true } });
    expect(() => client.track({ name: "interaction", timestamp: "t" })).not.toThrow();
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

    client.track({ name: "interaction", timestamp: "t1" });
    client.flush?.();
    client.flush?.();

    await Promise.resolve();
    expect(batchSink).toHaveBeenCalledTimes(1);
    resolveFlush();
    await Promise.resolve();
  });

  it("re-queues events if batchSink throws and succeeds on later flush", async () => {
    const batchSink = vi
      .fn<[], Promise<void>>()
      .mockRejectedValueOnce(new Error("nope"))
      .mockResolvedValueOnce(undefined);

    const client = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 100 },
    });

    client.track({ name: "interaction", timestamp: "t1" });

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
    client.track({ name: "interaction", timestamp: "t1" });
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
});

