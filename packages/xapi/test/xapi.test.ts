import { describe, expect, it, vi } from "vitest";
import {
  createInMemoryXAPIQueue,
  createXAPIClient,
} from "../src";
import { cryptoRandomId } from "../src/id";
import type { XAPIStatement } from "../src";

const courseId = "test";

describe("@lessonkit/xapi", () => {
  it("sends a course completion statement", async () => {
    const statements: XAPIStatement[] = [];
    const client = createXAPIClient({
      courseId,
      transport: async (s) => {
        statements.push(s);
      },
    });

    client.completeCourse();
    await Promise.resolve();

    expect(statements).toHaveLength(1);
    expect(statements[0]).toMatchObject({
      verb: "http://adlnet.gov/expapi/verbs/completed",
      object: { id: "urn:lessonkit:course:test" },
    });
  });

  it("calls onTransportError with the transport error when delivery fails", async () => {
    const onTransportError = vi.fn();
    const transport = vi.fn(async () => {
      throw new Error("network");
    });
    const client = createXAPIClient({ transport, courseId, onTransportError });
    client.startedLesson({ lessonId: "lesson-1" });
    await vi.waitFor(() => expect(onTransportError).toHaveBeenCalledTimes(1));
    expect(onTransportError).toHaveBeenCalledWith(expect.any(Error));
    expect(onTransportError.mock.calls[0]![0]).toMatchObject({ message: "network" });
  });

  it("queues when transport fails and flushes later", async () => {
    const queue = createInMemoryXAPIQueue();
    const transport = vi.fn<(statement: unknown) => Promise<void>>(async (_statement: unknown) => {
      throw new Error("network");
    });

    const client = createXAPIClient({ transport, courseId, queue });
    client.startedLesson({ lessonId: "lesson-1" });

    await new Promise((r) => setTimeout(r, 0));

    expect(client.queueSize()).toBe(1);

    transport.mockImplementation(async () => {});
    await client.flush();

    expect(client.queueSize()).toBe(0);
    expect(transport).toHaveBeenCalled();
  });

  it("flush rejects while transport keeps failing", async () => {
    const queue = createInMemoryXAPIQueue();
    const transport = vi.fn(async () => {
      throw new Error("network");
    });
    const client = createXAPIClient({ transport, courseId, queue });
    client.startedLesson({ lessonId: "lesson-1" });
    await new Promise((r) => setTimeout(r, 0));
    await expect(client.flush()).rejects.toThrow("network");
  });

  it("queues statements when no transport is provided", () => {
    const queue = createInMemoryXAPIQueue();
    const client = createXAPIClient({ courseId, queue });
    client.startedLesson({ lessonId: "lesson-1" });
    expect(client.queueSize()).toBe(1);
  });

  it("warns in dev when statements queue without transport", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");

    try {
      const client = createXAPIClient({ courseId });
      client.startedLesson({ lessonId: "lesson-1" });
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/no transport/));
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

  it("does not warn in production when statements queue without transport", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");

    try {
      const client = createXAPIClient({ courseId });
      client.startedLesson({ lessonId: "lesson-1" });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

  it("warns in dev when transport fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
    const transport = vi.fn(async () => {
      throw new Error("network");
    });

    try {
      const client = createXAPIClient({ transport, courseId });
      client.startedLesson({ lessonId: "lesson-1" });
      await new Promise((r) => setTimeout(r, 0));
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/transport failed/));
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

  it("uses getRandomValues fallback when crypto.randomUUID is unavailable", async () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (arr: Uint8Array) => {
        arr.fill(7);
        return arr;
      },
    });
    const queue = createInMemoryXAPIQueue();
    const client = createXAPIClient({ courseId, queue });
    client.startedLesson({ lessonId: "lesson-1" });
    expect(client.queueSize()).toBe(1);
    vi.unstubAllGlobals();
  });

  it("throws when secure RNG is unavailable", () => {
    vi.stubGlobal("crypto", {});
    try {
      expect(() => cryptoRandomId()).toThrow(/cryptoRandomId requires/);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("send() forwards statements to transport", async () => {
    const statements: XAPIStatement[] = [];
    const client = createXAPIClient({
      courseId,
      transport: async (s) => {
        statements.push(s);
      },
    });

    client.send({ id: "1", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o" } });
    await Promise.resolve();
    expect(statements).toHaveLength(1);
    expect(statements[0]).toMatchObject({ id: "1" });
  });

  it("retries duplicate send after in-flight transport failure", async () => {
    let calls = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transport = vi.fn(async () => {
      calls += 1;
      await gate;
      if (calls === 1) {
        throw new Error("network");
      }
    });
    const client = createXAPIClient({ transport, courseId });
    const statement: XAPIStatement = {
      id: "retry-inflight-1",
      timestamp: "t",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o" },
    };

    client.send(statement);
    client.send(statement);
    release();
    await new Promise((r) => setTimeout(r, 0));

    expect(calls).toBe(2);
    expect(client.queueSize()).toBe(0);
    transport.mockImplementation(async () => {});
    await client.flush();
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it("does not duplicate delivery when retry succeeds before flush", async () => {
    let calls = 0;
    const transport = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error("network");
      }
    });
    const client = createXAPIClient({ transport, courseId });
    const statement: XAPIStatement = {
      id: "retry-success-1",
      timestamp: "t",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o" },
    };

    client.send(statement);
    client.send(statement);
    await new Promise((r) => setTimeout(r, 10));

    expect(client.queueSize()).toBe(0);
    await client.flush();
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it("flushOnExit delivers all queued statements including in-flight head after abort", async () => {
    const exitCalls: XAPIStatement[] = [];
    const queue = createInMemoryXAPIQueue();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transport = vi.fn(async () => {
      await gate;
    });

    queue.enqueue({
      id: "head",
      timestamp: "t",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o1" },
    });
    queue.enqueue({
      id: "tail",
      timestamp: "t",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o2" },
    });

    const flushPromise = queue.flush(transport);
    await new Promise((r) => setTimeout(r, 0));
    expect(queue.getHeadInFlightId?.()).toBe("head");
    queue.flushOnExit((s) => {
      exitCalls.push(s);
    });
    expect(exitCalls.map((s) => s.id)).toEqual(["tail"]);

    release();
    await flushPromise;
    expect(exitCalls.map((s) => s.id)).toEqual(["tail"]);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("delivers a replacement payload after an in-flight statement with the same id succeeds", async () => {
    const statements: XAPIStatement[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transport = vi.fn(async (statement: XAPIStatement) => {
      await gate;
      statements.push(statement);
    });
    const client = createXAPIClient({ transport, courseId });
    const original: XAPIStatement = {
      id: "replace-1",
      timestamp: "t1",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o-old" },
    };
    const replacement: XAPIStatement = {
      id: "replace-1",
      timestamp: "t2",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o-new" },
    };

    client.send(original);
    client.send(replacement);
    release();
    await new Promise((r) => setTimeout(r, 0));
    await client.flush();

    expect(transport).toHaveBeenCalledTimes(2);
    expect(statements.map((s) => s.object.id)).toEqual(["o-old", "o-new"]);
  });

  it("does not send duplicate in-flight statements with the same id", async () => {
    const statements: XAPIStatement[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transport = vi.fn(async (statement: XAPIStatement) => {
      await gate;
      statements.push(statement);
    });
    const client = createXAPIClient({ transport, courseId });
    const statement: XAPIStatement = { id: "inflight-1", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o" } };

    client.send(statement);
    client.send(statement);
    release();
    await new Promise((r) => setTimeout(r, 0));

    expect(transport).toHaveBeenCalledTimes(1);
    expect(statements).toHaveLength(1);
  });

  it("does not duplicate queued statements with the same id on transport failure", async () => {
    const queue = createInMemoryXAPIQueue();
    const transport = vi.fn(async () => {
      throw new Error("network");
    });
    const client = createXAPIClient({ transport, courseId, queue });
    const statement: XAPIStatement = {
      id: "dup-1",
      timestamp: "t",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o" },
    };

    client.send(statement);
    client.send(statement);
    await new Promise((r) => setTimeout(r, 0));

    expect(client.queueSize()).toBe(1);
  });

  it("does not duplicate delivery when send follows transport failure re-queue", async () => {
    let calls = 0;
    const transport = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error("network");
      }
    });
    const client = createXAPIClient({ transport, courseId });
    const statement: XAPIStatement = {
      id: "requeue-1",
      timestamp: "t",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o" },
    };

    client.send(statement);
    await new Promise((r) => setTimeout(r, 20));
    expect(client.queueSize()).toBe(1);
    client.send(statement);
    await client.flush();
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it("auto-generates statement ids and dedupes empty-id sends on transport failure", async () => {
    const queue = createInMemoryXAPIQueue();
    const transport = vi.fn(async () => {
      throw new Error("network");
    });
    const client = createXAPIClient({ transport, courseId, queue });
    const statement: XAPIStatement = {
      id: "",
      timestamp: "t",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o" },
    };

    client.send(statement);
    client.send(statement);
    await new Promise((r) => setTimeout(r, 0));

    expect(statement.id).toBeTruthy();
    expect(client.queueSize()).toBe(1);
  });

  it("calls onMappingError and does not throw when mapper fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onMappingError = vi.fn();
    vi.stubEnv("NODE_ENV", "development");
    const mapModule = await import("../src/telemetryMap");
    const mapSpy = vi
      .spyOn(mapModule, "telemetryEventToXAPIStatement")
      .mockImplementation(() => {
        throw new Error("bad mapping");
      });
    const transport = vi.fn(async () => {});
    const client = createXAPIClient({ courseId, transport, onMappingError });

    try {
      expect(() => client.startedLesson({ lessonId: "lesson-1" })).not.toThrow();
      await Promise.resolve();
      expect(onMappingError).toHaveBeenCalledTimes(1);
      expect(onMappingError).toHaveBeenCalledWith(expect.any(Error));
      expect(onMappingError.mock.calls[0]![0]).toMatchObject({ message: "bad mapping" });
      expect(warn).toHaveBeenCalledWith("[lessonkit] xAPI mapping skipped:", "bad mapping");
      expect(transport).not.toHaveBeenCalled();
    } finally {
      mapSpy.mockRestore();
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });

  it("drops oldest non-head statement at cap while the head is in flight", async () => {
    const onCap = vi.fn();
    const queue = createInMemoryXAPIQueue({ maxSize: 2, onCap });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transport = vi.fn(async () => {
      await gate;
    });

    queue.enqueue({ id: "head", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o1" } });
    queue.enqueue({ id: "tail", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o2" } });

    const flushPromise = queue.flush(transport);
    await new Promise((r) => setTimeout(r, 0));

    expect(queue.size()).toBe(2);
    queue.enqueue({ id: "new", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o3" } });
    expect(queue.size()).toBe(2);
    expect(onCap).toHaveBeenCalledTimes(1);

    release();
    await flushPromise;
    expect(queue.size()).toBe(0);
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it("replaces a queued statement when enqueue repeats the same id", async () => {
    const verb = "http://adlnet.gov/expapi/verbs/experienced";
    const queue = createInMemoryXAPIQueue();
    queue.enqueue({ id: "dup", timestamp: "t1", verb, object: { id: "o1" } });
    queue.enqueue({ id: "dup", timestamp: "t2", verb, object: { id: "o2" } });
    expect(queue.size()).toBe(1);

    const delivered: XAPIStatement[] = [];
    await queue.flush(async (statement) => {
      delivered.push(statement);
    });
    expect(delivered).toHaveLength(1);
    expect(delivered[0]?.timestamp).toBe("t2");
  });

  it("persists overflow to onOverflow when maxSize is 1 and head is in flight", async () => {
    const verb = "http://adlnet.gov/expapi/verbs/experienced";
    const onCap = vi.fn();
    const onOverflow = vi.fn();
    const queue = createInMemoryXAPIQueue({ maxSize: 1, onCap, onOverflow });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    queue.enqueue({ id: "head", timestamp: "t", verb, object: { id: "o1" } });
    const flushPromise = queue.flush(async () => {
      await gate;
    });
    await new Promise((r) => setTimeout(r, 0));

    queue.enqueue({ id: "overflow", timestamp: "t", verb, object: { id: "o2" } });
    expect(onCap).toHaveBeenCalledTimes(1);
    expect(onOverflow).toHaveBeenCalledWith(
      expect.objectContaining({ id: "overflow", object: { id: "o2" } }),
    );
    expect(queue.size()).toBe(1);

    release();
    await flushPromise;
    expect(queue.size()).toBe(0);
  });

  it("concurrent client flush drains re-queued statements after the first flush finishes", async () => {
    let attempts = 0;
    const transport = vi.fn(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("transient");
    });
    const client = createXAPIClient({ courseId, transport });
    client.startedLesson({ lessonId: "lesson-1" });
    await new Promise((r) => setTimeout(r, 50));

    const first = client.flush().catch(() => undefined);
    const second = client.flush();
    await Promise.all([first, second]);

    expect(client.queueSize()).toBe(0);
    expect(attempts).toBeGreaterThanOrEqual(2);
  });

  it("default onQueueCap warns in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const client = createXAPIClient({ courseId, maxQueueSize: 2 });
      client.startedLesson({ lessonId: "a" });
      client.startedLesson({ lessonId: "b" });
      client.startedLesson({ lessonId: "c" });
      expect(warn).toHaveBeenCalledWith(
        "[lessonkit] xAPI queue reached capacity; oldest statement(s) dropped.",
      );
    } finally {
      warn.mockRestore();
      vi.unstubAllEnvs();
    }
  });

  it("flushOnExit hands off in-flight head to exit transport", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const exitCalls: XAPIStatement[] = [];
    const abortIds: string[] = [];
    const client = createXAPIClient({
      courseId,
      transport: async () => {
        await gate;
      },
      exitTransport: (statement) => {
        exitCalls.push(statement);
      },
      abortInFlight: (id) => {
        abortIds.push(id);
      },
    });

    client.startedLesson({ lessonId: "lesson-1" });
    await Promise.resolve();
    client.flushOnExit?.();
    expect(abortIds.length).toBeGreaterThan(0);
    expect(exitCalls.length).toBeGreaterThan(0);
    release();
  });

  it("queue flush rejects on first transport error and keeps remainder queued", async () => {
    const queue = createInMemoryXAPIQueue();
    queue.enqueue({ id: "1", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o" } });
    queue.enqueue({ id: "2", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o" } });

    const transport = vi
      .fn<(statement: unknown) => Promise<void>>(async (_statement: unknown) => {})
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(undefined);

    await expect(queue.flush(transport)).rejects.toThrow("fail");
    expect(queue.size()).toBe(2);
    expect(transport).toHaveBeenCalledTimes(1);

    await queue.flush(transport);
    expect(queue.size()).toBe(0);
  });

  it("client flush rejects when queue drain fails", async () => {
    const queue = createInMemoryXAPIQueue();
    const transport = vi.fn(async () => {
      throw new Error("network");
    });
    const client = createXAPIClient({ transport, courseId, queue });
    client.startedLesson({ lessonId: "lesson-1" });
    await new Promise((r) => setTimeout(r, 0));
    await expect(client.flush()).rejects.toThrow("network");
    expect(client.queueSize()).toBeGreaterThan(0);
  });

  it("abandonUndelivered persists queued statements to dead-letter storage", async () => {
    vi.stubGlobal(
      "sessionStorage",
      (() => {
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
      })(),
    );
    const { loadDeadLetterStatements, resetXAPIDeadLetterForTests } = await import("../src");
    resetXAPIDeadLetterForTests();

    const transport = vi.fn(async () => {
      throw new Error("network");
    });
    const client = createXAPIClient({
      transport,
      courseId,
      queue: createInMemoryXAPIQueue(),
    });
    client.startedLesson({ lessonId: "lesson-1" });
    await new Promise((r) => setTimeout(r, 0));
    expect(client.queueSize()).toBeGreaterThan(0);

    client.abandonUndelivered?.();

    expect(client.queueSize()).toBe(0);
    expect(loadDeadLetterStatements().length).toBeGreaterThan(0);
  });

  it("skips poison-pill head after repeated failures", async () => {
    const onHeadSkipped = vi.fn();
    const queue = createInMemoryXAPIQueue({ maxHeadFailures: 2, onHeadSkipped });
    queue.enqueue({ id: "bad", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o1" } });
    queue.enqueue({ id: "good", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o2" } });

    const transport = vi.fn(async (statement: XAPIStatement) => {
      if (statement.id === "bad") throw new Error("permanent");
    });

    await expect(queue.flush(transport)).rejects.toThrow("permanent");
    await queue.flush(transport);

    expect(onHeadSkipped).toHaveBeenCalledTimes(1);
    expect(queue.size()).toBe(0);
    expect(transport).toHaveBeenCalledTimes(3);
  });

  it("queue onHeadSkipped hook persists skipped statements to dead-letter storage", async () => {
    vi.stubGlobal(
      "sessionStorage",
      (() => {
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
      })(),
    );
    const { loadDeadLetterStatements, persistDeadLetterStatement, resetXAPIDeadLetterForTests } =
      await import("../src");
    resetXAPIDeadLetterForTests();

    const queue = createInMemoryXAPIQueue({
      maxHeadFailures: 1,
      onHeadSkipped: (statement) => persistDeadLetterStatement(statement),
    });
    queue.enqueue({
      id: "bad",
      timestamp: "t",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o1" },
    });
    await queue.flush(async () => {
      throw new Error("permanent");
    });

    expect(loadDeadLetterStatements().map((s) => s.id)).toContain("bad");
    vi.unstubAllGlobals();
  });

  it("adds duration and score to completion result", async () => {
    const statements: XAPIStatement[] = [];
    const client = createXAPIClient({
      courseId,
      transport: async (s) => {
        statements.push(s);
      },
    });

    client.completeLesson({ lessonId: "lesson-1", durationMs: 1500, score: 7, maxScore: 10, success: true });

    await Promise.resolve();

    expect(statements).toHaveLength(1);
    expect(statements[0].result).toMatchObject({
      duration: "PT1.5S",
      success: true,
      score: { raw: 7, max: 10, min: 0, scaled: 0.7 },
    });
    expect(statements[0].object.id).toBe("urn:lessonkit:course:test:lesson:lesson-1");
  });

  it("formats integer seconds without decimals (durationMs=2000 => PT2S)", async () => {
    const statements: XAPIStatement[] = [];
    const client = createXAPIClient({
      courseId,
      transport: async (s) => {
        statements.push(s);
      },
    });

    client.completeLesson({ lessonId: "lesson-1", durationMs: 2000 });
    await Promise.resolve();

    expect(statements).toHaveLength(1);
    expect(statements[0].result).toMatchObject({ duration: "PT2S" });
  });

  it("flush is noop without transport", async () => {
    const client = createXAPIClient({ courseId });
    await expect(client.flush()).resolves.toBeUndefined();
  });

  it("flush awaits in-flight direct sends before resolving", async () => {
    const delivered: XAPIStatement[] = [];
    let releaseTransport!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseTransport = resolve;
    });
    const transport = vi.fn(async (statement: XAPIStatement) => {
      await gate;
      delivered.push(statement);
    });
    const client = createXAPIClient({ transport });
    client.send({
      id: "inflight-1",
      timestamp: "2020-01-01T00:00:00Z",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "urn:example:activity" },
    });

    const flushPromise = client.flush();
    await Promise.resolve();
    expect(delivered).toHaveLength(0);

    releaseTransport();
    await flushPromise;
    expect(delivered).toHaveLength(1);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("drops oldest statements when queue exceeds maxSize and calls onCap", () => {
    const caps: number[] = [];
    const depths: number[] = [];
    const overflowed: string[] = [];
    const queue = createInMemoryXAPIQueue({
      maxSize: 2,
      onCap: () => caps.push(1),
      onDepth: (n) => depths.push(n),
      onOverflow: (statement) => overflowed.push(statement.id),
    });
    const stmt = (id: string): XAPIStatement => ({
      id,
      timestamp: "t",
      verb: "http://adlnet.gov/expapi/verbs/experienced",
      object: { id: "o" },
    });
    queue.enqueue(stmt("1"));
    queue.enqueue(stmt("2"));
    queue.enqueue(stmt("3"));
    expect(queue.size()).toBe(2);
    expect(caps).toHaveLength(1);
    expect(overflowed).toEqual(["1"]);
    expect(depths.at(-1)).toBe(2);
  });

  it("coalesces concurrent flush calls so each statement is sent once", async () => {
    const queue = createInMemoryXAPIQueue();
    queue.enqueue({ id: "1", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o1" } });
    queue.enqueue({ id: "2", timestamp: "t", verb: "http://adlnet.gov/expapi/verbs/experienced", object: { id: "o2" } });

    const delivered: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const transport = vi.fn(async (statement: XAPIStatement) => {
      delivered.push(statement.id);
      if (delivered.length === 1) {
        await gate;
      }
    });

    const first = queue.flush(transport);
    const second = queue.flush(transport);
    release();
    await Promise.all([first, second]);

    expect(delivered).toEqual(["1", "2"]);
    expect(transport).toHaveBeenCalledTimes(2);
    expect(queue.size()).toBe(0);
  });

  it("lifecycle helpers noop without courseId", async () => {
    const transport = vi.fn(async () => {});
    const client = createXAPIClient({ transport });
    client.startedLesson({ lessonId: "lesson-1" });
    client.completeLesson({ lessonId: "lesson-1" });
    client.completeCourse();
    await Promise.resolve();
    expect(transport).not.toHaveBeenCalled();
  });

  it("omits result when completion has no extra fields", async () => {
    const statements: XAPIStatement[] = [];
    const client = createXAPIClient({
      courseId,
      transport: async (s) => {
        statements.push(s);
      },
    });

    client.completeLesson({ lessonId: "lesson-1" });
    await Promise.resolve();

    expect(statements).toHaveLength(1);
    expect(statements[0].result).toBeUndefined();
  });

  it("flushOnExit drains queue via exitTransport", () => {
    const exitCalls: XAPIStatement[] = [];
    const queue = createInMemoryXAPIQueue();
    const client = createXAPIClient({
      courseId,
      queue,
      exitTransport: (s) => {
        exitCalls.push(s);
      },
    });

    client.completeCourse();
    expect(client.queueSize()).toBe(1);
    client.flushOnExit?.();
    expect(exitCalls).toHaveLength(1);
    expect(client.queueSize()).toBe(0);
  });
});
