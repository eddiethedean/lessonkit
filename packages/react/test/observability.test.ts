import { describe, expect, it, vi, afterEach } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import type { XAPIStatement } from "@lessonkit/xapi";
import * as xapiModule from "@lessonkit/xapi";
import {
  createXapiQueueFromObservability,
  wrapBatchSink,
  wrapTrackingSink,
  warnMissingProductionObservability,
} from "../src/runtime/observability";

function stubSessionStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => store.set(key, value),
  } as Storage;
}

const stmt = (id: string): XAPIStatement => ({
  id,
  timestamp: "t",
  verb: "http://adlnet.gov/expapi/verbs/experienced",
  object: { id: "o" },
});

describe("createXapiQueueFromObservability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    xapiModule.resetXAPIDeadLetterForTests();
  });

  it("persists overflowed statements to dead-letter storage", async () => {
    vi.stubGlobal("sessionStorage", stubSessionStorage());
    const { createInMemoryXAPIQueue: realCreateQueue } =
      await vi.importActual<typeof xapiModule>("@lessonkit/xapi");
    vi.spyOn(xapiModule, "createInMemoryXAPIQueue").mockImplementation((opts) =>
      realCreateQueue({ ...opts, maxSize: 1 }),
    );

    const onXapiQueueCap = vi.fn();
    const queue = createXapiQueueFromObservability(() => ({ onXapiQueueCap }));
    queue.enqueue(stmt("dropped"));
    queue.enqueue(stmt("kept"));

    expect(onXapiQueueCap).toHaveBeenCalledTimes(1);
    expect(xapiModule.loadDeadLetterStatements().map((s) => s.id)).toEqual(["dropped"]);
  });

  it("persists head-skipped statements to dead-letter storage", async () => {
    vi.stubGlobal("sessionStorage", stubSessionStorage());
    const { createInMemoryXAPIQueue: realCreateQueue } =
      await vi.importActual<typeof xapiModule>("@lessonkit/xapi");
    vi.spyOn(xapiModule, "createInMemoryXAPIQueue").mockImplementation((opts) =>
      realCreateQueue({ ...opts, maxHeadFailures: 1 }),
    );

    const queue = createXapiQueueFromObservability();
    queue.enqueue(stmt("bad"));
    await queue.flush(async () => {
      throw new Error("permanent");
    });

    expect(xapiModule.loadDeadLetterStatements().map((s) => s.id)).toContain("bad");
  });

  it("reports dead-letter persist errors via observability hook", async () => {
    vi.stubGlobal("sessionStorage", undefined);
    const { createInMemoryXAPIQueue: realCreateQueue } =
      await vi.importActual<typeof xapiModule>("@lessonkit/xapi");
    vi.spyOn(xapiModule, "createInMemoryXAPIQueue").mockImplementation((opts) =>
      realCreateQueue({ ...opts, maxSize: 1 }),
    );

    const onXapiDeadLetterPersistError = vi.fn();
    const queue = createXapiQueueFromObservability(() => ({ onXapiDeadLetterPersistError }));
    queue.enqueue(stmt("kept"));
    queue.enqueue(stmt("dropped"));

    expect(onXapiDeadLetterPersistError).toHaveBeenCalledWith(expect.any(Error), {
      statement: expect.objectContaining({ id: "kept" }),
    });
  });
});

describe("wrapBatchSink", () => {
  it("reports batchSink errors via onTelemetrySinkError", async () => {
    const onTelemetrySinkError = vi.fn();
    const batchSink = vi.fn(() => Promise.reject(new Error("batch fail")));
    const wrapped = wrapBatchSink(batchSink, { onTelemetrySinkError });
    await expect(wrapped?.([{ name: "interaction" } as TelemetryEvent])).rejects.toThrow(
      "batch fail",
    );
    expect(onTelemetrySinkError).toHaveBeenCalledWith(expect.any(Error), {
      sinkId: "tracking-batch",
    });
  });
});

describe("warnMissingProductionObservability", () => {
  it("does not warn in test environment", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    warnMissingProductionObservability(undefined, { trackingEnabled: true, xapiEnabled: true });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("wrapTrackingSink", () => {
  it("reports sync sink errors and rethrows", () => {
    const onTelemetrySinkError = vi.fn();
    const sink = vi.fn(() => {
      throw new Error("boom");
    });
    const wrapped = wrapTrackingSink(sink, { onTelemetrySinkError });
    expect(() =>
      wrapped?.({ name: "interaction", timestamp: "t", courseId: "c" } as TelemetryEvent),
    ).toThrow("boom");
    expect(onTelemetrySinkError).toHaveBeenCalledWith(expect.any(Error), { sinkId: "tracking" });
  });

  it("reports async sink rejections", async () => {
    const onTelemetrySinkError = vi.fn();
    const sink = vi.fn(() => Promise.reject(new Error("async")));
    const wrapped = wrapTrackingSink(sink, { onTelemetrySinkError });
    await expect(
      wrapped?.({ name: "interaction", timestamp: "t", courseId: "c" } as TelemetryEvent),
    ).rejects.toThrow("async");
    expect(onTelemetrySinkError).toHaveBeenCalled();
  });
});
