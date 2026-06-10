import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  createXAPIClient,
  loadDeadLetterStatements,
  resetXAPIDeadLetterForTests,
} from "../src";
import type { XAPIStatement } from "../src";

function createMockSessionStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, value);
    },
  } as Storage;
}

const stmt: XAPIStatement = {
  id: "exit-stmt-1",
  timestamp: "2026-01-01T00:00:00Z",
  verb: "http://adlnet.gov/expapi/verbs/completed",
  object: { id: "urn:example:activity" },
};

describe("xAPI exit delivery (C-1)", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", createMockSessionStorage());
    resetXAPIDeadLetterForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists to dead-letter when async exit transport rejects", async () => {
    const client = createXAPIClient({
      courseId: "course-1",
      exitTransport: () => Promise.reject(new Error("keepalive-failed")),
    });
    client.send(stmt);
    client.flushOnExit?.();
    await new Promise((r) => setTimeout(r, 0));
    expect(loadDeadLetterStatements().map((s) => s.id)).toContain("exit-stmt-1");
  });

  it("reports dead-letter persist failures via onDeadLetterPersistError", async () => {
    vi.spyOn(sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const onDeadLetterPersistError = vi.fn();
    const client = createXAPIClient({
      courseId: "course-1",
      exitTransport: () => Promise.reject(new Error("keepalive-failed")),
      onDeadLetterPersistError,
    });
    client.send(stmt);
    client.flushOnExit?.();
    await new Promise((r) => setTimeout(r, 0));
    expect(onDeadLetterPersistError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "quota" }),
      { statement: expect.objectContaining({ id: "exit-stmt-1" }) },
    );
  });

  it("re-queues dead-letter statements on next client init", () => {
    sessionStorage.setItem("lk-xapi-dead-letter", JSON.stringify([stmt]));
    const client = createXAPIClient({ courseId: "course-1" });
    expect(client.queueSize()).toBe(1);
  });

  it("auto-flushes dead-letter statements when transport is configured", async () => {
    sessionStorage.setItem("lk-xapi-dead-letter", JSON.stringify([stmt]));
    const transport = vi.fn(async () => {});
    const client = createXAPIClient({ courseId: "course-1", transport });
    await new Promise((r) => setTimeout(r, 0));
    expect(transport).toHaveBeenCalledTimes(1);
    expect(client.queueSize()).toBe(0);
  });

  it("does not mark statement delivered until async exit succeeds", async () => {
    let resolveExit!: () => void;
    const exitGate = new Promise<void>((resolve) => {
      resolveExit = resolve;
    });
    const client = createXAPIClient({
      courseId: "course-1",
      exitTransport: () => exitGate,
    });
    client.send({ ...stmt, id: "retry-me" });
    expect(client.queueSize()).toBe(1);
    client.flushOnExit?.();
    expect(client.queueSize()).toBe(0);
    expect(loadDeadLetterStatements()).toHaveLength(0);
    resolveExit();
    await exitGate;
    client.send({ ...stmt, id: "other" });
    expect(client.queueSize()).toBe(1);
  });
});

describe("xAPI flush serialization (H-10)", () => {
  it("flush waits for concurrent direct sends", async () => {
    const transport = vi.fn(async () => {});
    const client = createXAPIClient({ courseId: "course-1", transport });
    client.send({ ...stmt, id: "a" });
    const flushPromise = client.flush();
    client.send({ ...stmt, id: "b" });
    await flushPromise;
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it("flushOnExit dispatches in-flight statements through exit transport without re-queue on abort", async () => {
    const abortInFlight = vi.fn();
    let rejectTransport!: (err: Error) => void;
    const transport = vi.fn(
      () =>
        new Promise<void>((_, reject) => {
          rejectTransport = reject;
        }),
    );
    const exitTransport = vi.fn(async () => {});
    const client = createXAPIClient({
      courseId: "course-1",
      transport,
      exitTransport,
      abortInFlight,
    });
    client.send({ ...stmt, id: "inflight-exit" });
    await Promise.resolve();
    client.flushOnExit?.();
    expect(abortInFlight).toHaveBeenCalledWith("inflight-exit");
    expect(exitTransport).toHaveBeenCalledTimes(1);
    rejectTransport(new Error("aborted"));
    await Promise.resolve();
    expect(client.queueSize()).toBe(0);
    await client.flush();
    expect(transport).toHaveBeenCalledTimes(1);
    expect(exitTransport).toHaveBeenCalledTimes(1);
  });
});
